const server = require('@jspreadsheet/server');
const openai = require('@jspreadsheet/openai');
const adapter = require('@jspreadsheet/server-mongodb');
const api = require('@jspreadsheet/server-api');
const jwt = require('jsonwebtoken');

// Load from ENV
require('dotenv').config();

// Jspreadsheet license
const license = {
    clientId: process.env.JSS_CLIENT,
    licenseKey: process.env.JSS_LICENSE
};

// Connect API to S3
api({
    s3: {
        key: process.env.AWS_S3_KEY,
        secret: process.env.AWS_S3_SECRET,
        bucket: process.env.AWS_BUCKET,
        region: process.env.AWS_S3_REGION,
        url: process.env.AWS_S3_URL,
    },
    adapter: adapter
});

/**
 * Identify if a method is part of a list of methods that requires authentication
 * @param method
 * @returns {boolean}
 */
const requireOwnership = function(method) {
    return [
        'setConfig',
        'setUsers',
        'deleteUsers',
        'createSnapshot',
        'restoreSnapshot',
        'deleteSnapshot'
    ].includes(method);
}

/**
 * This method brings the level of the user
 * @param {string} guid which document the user is trying to access
 * @param {object} auth information about the authentication
 * @returns {number|boolean}
 */
const getUserLevel = async function(guid, auth) {
    // You must validate if the token is valid
    let info = await jwt.decode(auth.token);
    // Get the document information
    let document = await adapter.get(guid);
    if (document) {
        // The user_id matches the subject in your JWT
        if (info && info.sub === document.user_id) {
            // He is the owner
            return 2;
        }
        // Spreadsheet is flagged as public
        if (! document.spreadsheet.privacy) {
            // He has editor privileges
            return 1;
        }
        // Check if there are any invitations on this document
        if (auth.invitation) {
            // There are invited users
            if (document.users && document.users.length) {
                // Search for the invitation code among invited users
                for (let i = 0; i < document.users.length; i++) {
                    // Match the invitation code
                    if (document.users[i].hash === auth.invitation) {
                        // Level is defined on the invitation 0 (readonly), 1 (editor), 2 (owner)
                        return document.users[i].level;
                    }
                }
            }
        }
    }

    return false;
}

/**
 * Method to check has permission to proceed
 * @param {string} method Purpose of the request
 * @param {string|null} guid which document user is trying to get access
 * @param {object} auth Information about the user authentication
 * @return {Promise<boolean>}
 */
const Authentication = async function(method, guid, auth) {
    // The user is trying to load a document
    if (guid) {
        // Accept all formify actions
        if (auth.origin === 'formify') {
            return true;
        }

        // Get the user level in relation to the documented requested
        let level = await getUserLevel(guid, auth);
        if (level !== false) {
            // Any invited user can connect, load. Only editors (1) or owners (2) can change the spreadsheet.
            if (level === 0) {
                // Readonly level, cannot change the spreadsheet
                if (method !== 'change') {
                    return true;
                }
            } else {
                return true;
            }
        }
    } else {
        // Connection the server
        return true;
    }

    // No access
    return false;
}

/**
 * Create the Jspreadsheet Server
 */
server({
    config: {
        cors: {
            origin: "*"
        },
    },
    port: 3000,
    beforeConnect: async function(auth) {
        // Return false to block the user to connect
        return await Authentication('connect', null, auth);
    },
    beforeLoad: async function(guid, auth) {
        // Return false to block the user to load a spreadsheet
        return await Authentication('load', guid, auth);
    },
    beforeChange: async function(guid, changes, auth) {
        // Before the user changes the spreadsheet
        let test = await Authentication('change', guid, auth);
        if (test) {
            // Overwrite image upload and save to S3 bucket
            if (changes.method === 'setMedia') {
                // Make sure entries have been submitted to avoid errors
                if (Array.isArray(changes.args[0])) {
                    // Check any images to upload to S3
                    for (const v of changes.args[0]) {
                        // Found image to be uploaded
                        if (v.src && v.src.substr(0, 5) === 'data:') {
                            // Overwrite the URL before saving to the database
                            let ret = await api.setImage(guid, v.src);
                            if (ret) {
                                v.src = ret;
                            }
                        }
                    }
                }
            } else {
                // Verify if the method requires ownership
                if (requireOwnership(changes.method)) {
                    // Requires ownership
                    let level = await getUserLevel(guid, auth);
                    // User is owner
                    if (level === 2) {
                        // For the users check if you need to send email
                        if (changes.method === 'setUsers') {
                            // Interface is flagged to send email
                            let sendmail = changes.args[1];
                            if (sendmail) {
                                let users = changes.args[0];
                                if (users && users.length) {
                                    // Send the invitation by email
                                    console.log(users)
                                }
                            }
                        }
                    } else {
                        // The user does not have permission
                        return false;
                    }
                }
            }
        }
        return test;
    },
    load: async function(guid, auth, cachedConfiguration) {
        // Load the spreadsheet when is not already in cache
        if (! cachedConfiguration) {
            // Load the spreadsheet from the adapter
            cachedConfiguration = await adapter.load(guid, auth);
        }
        // Get the user level for this document
        let level = await getUserLevel(guid, auth);
        // Readonly level
        if (level === 0) {
            // Make sure the spreadsheet is not editable
            cachedConfiguration.editable = false;
        }
        return cachedConfiguration;
    },
    change: async function(guid, changes, auth, onerror) {
        return await adapter.change(guid, changes, auth, onerror);
    },
    create: async function(guid, config, auth) {
        return await adapter.create(guid, config, auth);
    },
    destroy: async function(guid, auth) {
        return await adapter.destroy(guid, auth);
    },
    replace: async function(guid, config, auth) {
        return await adapter.replace(guid, config, auth);
    },
    error: function(e) {
        console.error('Error', e)
    },
    license: license,
    extensions: { openai, api },
});

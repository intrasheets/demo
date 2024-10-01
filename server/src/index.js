const server = require('@jspreadsheet/server');
const openai = require('@jspreadsheet/openai');
const adapter = require('@jspreadsheet/server-mongodb');
const api = require('@jspreadsheet/server-api');

// Jspreadsheet license
const license = {
    clientId: '356a192b7913b04c54574d18c28d46e6395428ab',
    licenseKey: 'MmIyMDhmYmY4NGI1ZDY1ODAwNThjMGZkOTVkNjg2MmQ1NzZmYTFhOTBmZWI3N2M3ZmQ1N2Q3YjMwNDNhMjRhYmViYmRkNGVjZjZlMmNkNDVhODJhYzg1ZmRiY2E3OTJhYjA1ODQzNTliZGZiMmYwNWM4YmRmMjAyZmUwODA1NmEsZXlKamJHbGxiblJKWkNJNklqTTFObUV4T1RKaU56a3hNMkl3TkdNMU5EVTNOR1F4T0dNeU9HUTBObVUyTXprMU5ESTRZV0lpTENKdVlXMWxJam9pU25Od2NtVmhaSE5vWldWMElpd2laR0YwWlNJNk1UYzBNak0wTWpRd01Dd2laRzl0WVdsdUlqcGJJbXB6YUdWc2JDNXVaWFFpTENKamMySXVZWEJ3SWl3aWFuTndjbVZoWkhOb1pXVjBMbU52YlNJc0luVmxMbU52YlM1aWNpSXNJbU5rY0c0dWFXOGlMQ0pwYm5SeVlYTm9aV1YwY3k1amIyMGlMQ0p6Wm1OdlpHVmliM1F1WTI5dElpd2lkMlZpSWl3aWJHOWpZV3hvYjNOMElsMHNJbkJzWVc0aU9pSXpOQ0lzSW5OamIzQmxJanBiSW5ZM0lpd2lkamdpTENKMk9TSXNJbll4TUNJc0luWXhNU0lzSW1admNtMXpJaXdpWm05eWJYVnNZU0lzSW5KbGJtUmxjaUlzSW5CaGNuTmxjaUlzSW1sdGNHOXlkR1Z5SWl3aWRtRnNhV1JoZEdsdmJuTWlMQ0pqYjIxdFpXNTBjeUlzSW5ObFlYSmphQ0lzSW1Ob1lYSjBjeUlzSW5CeWFXNTBJaXdpWW1GeUlpd2ljMmhsWlhSeklpd2lZMnh2ZFdRaUxDSnRZWE5ySWl3aWMyaGxaWFJ6SWl3aWMyVnlkbVZ5SWl3aWFXNTBjbUZ6YUdWbGRITWlYWDA9'
}

// MongoDB adapter
adapter({
    // Connect API to the mongodb adapter
    api: api,
    // Define the S3 information for history and image upload
    /*s3: {
        key: "",
        secret: "",
        bucket: "",
        region: "",
        url: "",
    }*/
})

// Jspreadsheet server
server({
    config: {
        cors: {
            origin: "*"
        },
    },
    port: 3000,
    error: function(e) {
        console.error(e)
    },
    auth: async function(query) {
        // Get the document
        if (query.guid) {
            let document = await adapter.get(query.guid);
        }
        return true;
    },
    load: async function(guid) {
        return await adapter.load(guid);
    },
    beforeChange: async function(guid, changes, query) {
        let test = true;

        // Get the document
        if (query && query.guid) {
            // Get document
            let document = await adapter.get(query.guid);
            // Check permissions

            if (test === true) {
                // Overwrite image upload to S3
                await adapter.beforeChange(guid, changes, query);
            }
        }

        return test;
    },
    change: async function(guid, changes, query) {
        return await adapter.change(guid, changes, query);
    },
    create: async function(guid, config, query) {
        return await adapter.create(guid, config, query);
    },
    destroy: async function(guid, query) {
        return await adapter.destroy(guid, query);
    },
    license: license,
    extensions: { openai, api },
});

const jspreadsheet = require('jspreadsheet');
const intrasheets = require('intrasheets');

require('jsuites/dist/jsuites.css');
require('jspreadsheet/dist/jspreadsheet.css');
require('intrasheets/dist/style.css');

require('./style.css');

function Sheets() {
    // Jwt token
    let token = localStorage.getItem('intrasheets');
    // Get the configuration from the route
    let path = window.location.pathname.split('/');
    // Go to the correct route
    if (path[1] !== 'sheets') {
        window.location.href = '/sheets';
    }

    // Guid
    let guid = path[2];
    // Invitation code
    let invitation = path[3];

    // Set your JSS license key (The following key only works for one day)
    jspreadsheet.setLicense('MTBiNWIzY2E5NzhjZTllODA2OGNmMDZlMGFkZWM2MDkxY2UwN2I0ZDlmZTdlMDQ0MjM1MDQ4N2M0ZDRjZGMxZjVlYTJhZTc0MTAyNTVlZGMxNWEyM2E0YjMzNjZkYmU0ZWQ5ODdmOGI1M2JhNTJkNWI3MTNmMTlhNDQxYzJiNTEsZXlKamJHbGxiblJKWkNJNklqTTFObUV4T1RKaU56a3hNMkl3TkdNMU5EVTNOR1F4T0dNeU9HUTBObVUyTXprMU5ESTRZV0lpTENKdVlXMWxJam9pU25Od2NtVmhaSE5vWldWMElpd2laR0YwWlNJNk1UYzJNREExTURnd01Dd2laRzl0WVdsdUlqcGJJbXB6YUdWc2JDNXVaWFFpTENKamMySXVZWEJ3SWl3aWFuTndjbVZoWkhOb1pXVjBMbU52YlNJc0ltTmtjRzR1YVc4aUxDSnBiblJ5WVhOb1pXVjBjeTVqYjIwaUxDSnpkR0ZqYTJKc2FYUjZMbU52YlNJc0luZGxZbU52Ym5SaGFXNWxjaTVwYnlJc0ltUmxkbVZzYjNBdWJHbG5hSFJ1YVc1bkxtWnZjbU5sTG1OdmJTSXNJbmRsWWlJc0lteHZZMkZzYUc5emRDSmRMQ0p3YkdGdUlqb2lNelVpTENKelkyOXdaU0k2V3lKMk55SXNJblk0SWl3aWRqa2lMQ0oyTVRBaUxDSjJNVEVpTENKbWIzSnRjeUlzSW1admNtMTFiR0VpTENKeVpXNWtaWElpTENKd1lYSnpaWElpTENKcGJYQnZjblJsY2lJc0luWmhiR2xrWVhScGIyNXpJaXdpWTI5dGJXVnVkSE1pTENKelpXRnlZMmdpTENKamFHRnlkSE1pTENKd2NtbHVkQ0lzSW1KaGNpSXNJbk5vWldWMGN5SXNJbk5vWVhCbGN5SXNJbk5sY25abGNpSXNJbVp2Y20xaGRDSXNJbWx1ZEhKaGMyaGxaWFJ6SWwxOQ==');

    // Register the extension
    jspreadsheet.setExtensions({ intrasheets });

    // Start intrasheets
    intrasheets({
        google: {
            clientId: 'yourClientId.apps.googleusercontent.com',
            apiKey: 'yourApiKey',
            redirectUri: 'http://localhost:8000/sheets',
            errorUri: 'http://localhost:8000/sheets/error',
        },
        bar: {
            suggestions: true
        },
        client: {
            url: 'http://localhost:3009',
            auth: {
                token: token,
                invitation: invitation,
            },
            onerror: function (e) {
                console.error(e);
            },
            onbeforeloadimage: function (worksheet, img, options) {
                // Image should be loaded from the API
                if (options.src.includes('/api')) {
                    // Intercept the images load to get those from the S3
                    fetch('http://localhost:3009' + options.src, {
                        headers: {
                            'Authorization': `Bearer ${token},${invitation}`
                        }
                    })
                        .then(response => {
                            // Convert the response to a blob
                            return response.blob();
                        })
                        .then(blob => {
                            // Create and return a URL for the blob
                            img.src = URL.createObjectURL(blob);
                        });

                    // Do not load images until the download is ready
                    return false;
                }
            },
        }
    })

    // Start application
    if (guid && guid.length === 36) {
        // Open the spreadsheet
        jspreadsheet(document.getElementById('root'), {
            guid: guid
        });
    } else {
        // List all spreadsheets save for one user
        intrasheets.list(document.getElementById('root'));
    }
}


/**
 * Create your authentication method and save the token with sub and name. You need to validate this token on your server.
 *     Example: { sub: 1000, name: 'John Lennon' }
 */
localStorage.setItem('intrasheets', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMDAwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.18wUaRE2Nn389hp8pBRO898aRuhGV1V_5a3FcThBl3c')

// Start intrasheets
Sheets();
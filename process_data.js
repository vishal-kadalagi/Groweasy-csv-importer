const fs = require('fs');
const { parse } = require('csv-parse/sync');

const parseCsv = (file) => parse(fs.readFileSync(file, 'utf8'), { columns: true, skip_empty_lines: true });

function mapFacebook(record) {
    return {
        created_at: new Date(record.created_time).toISOString(),
        name: record.full_name,
        email: record.email,
        mobile_without_country_code: record.phone_number,
        company: record.company_name,
        city: record.city,
        data_source: "facebook"
    };
}

function mapRealEstate(record) {
    return {
        created_at: new Date(record['Lead Entry Date']).toISOString(),
        name: record['Prospect Name'],
        email: record['Primary Email'],
        mobile_without_country_code: record['Mobile 1'],
        crm_note: record['Mobile 2'] ? `Secondary Mobile: ${record['Mobile 2']}. Remarks: ${record['Notes/Remarks']}` : record['Notes/Remarks'],
        data_source: record['Property Interested In'],
        possession_time: record['Possession Needed By'],
        lead_owner: record['Assigned Agent']
    };
}

function mapMessy(record) {
    const contactStr = record['Contact Details'];
    let email = "", phone = "";
    if (contactStr.includes('/')) {
        const parts = contactStr.split(' / ');
        email = parts[0];
        phone = parts[1];
    } else if (contactStr.includes('@')) {
        email = contactStr;
    } else if (contactStr.includes('-')) {
        phone = contactStr;
    }

    const companyClient = record['Client'];
    let company = "", name = "";
    if (companyClient.includes('(')) {
        const parts = companyClient.split(' (');
        company = parts[0];
        name = parts[1].replace(')', '');
    }

    return {
        created_at: new Date(record['Date Added']).toISOString(),
        name: name,
        company: company,
        email: email,
        mobile_without_country_code: phone,
        city: record['Location'],
        crm_status: record['Status Update'],
        crm_note: record['Extra Info']
    };
}

function mapTestLeads(record) {
    return {
        created_at: new Date(record['Timestamp']).toISOString(),
        name: record['Full Name'],
        email: record['Email Address'],
        mobile_without_country_code: record['Phone Number'],
        company: record['Company Name'],
        city: record['City'],
        state: record['State'],
        country: record['Country'],
        lead_owner: record['Lead Owner'],
        crm_status: record['Lead Status'],
        crm_note: record['Remarks']
    };
}

function processData() {
    const extracted = [];
    const skipped = [];

    const processFile = (file, mapper) => {
        if (!fs.existsSync(file)) return;
        const records = parseCsv(file);
        for (const raw of records) {
            try {
                const mapped = mapper(raw);
                if (!mapped.email && !mapped.mobile_without_country_code) {
                    skipped.push({ ...raw, reason: "No email or mobile" });
                } else {
                    extracted.push(mapped);
                }
            } catch (e) {
                skipped.push({ ...raw, reason: "Error parsing: " + e.message });
            }
        }
    };

    processFile('facebook_leads_export.csv', mapFacebook);
    processFile('real_estate_crm.csv', mapRealEstate);
    processFile('messy_sales_report.csv', mapMessy);
    processFile('test_leads.csv', mapTestLeads);

    fs.writeFileSync('extracted_data.json', JSON.stringify({ extracted, skipped }, null, 2));
    console.log(`Processed ${extracted.length} valid records and skipped ${skipped.length} records.`);
}

processData();

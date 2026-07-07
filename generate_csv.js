const fs = require('fs');

// Helpers
const randElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const pad = (n) => n.toString().padStart(2, '0');

const firstNames = ["Alice", "Bob", "Charlie", "Diana", "Eve", "Frank", "Grace", "Heidi", "Ivan", "Judy", "Mallory", "Victor", "Peggy", "Sybil", "Trent", "Arjun", "Priya", "Rahul", "Anjali", "Vikram"];
const lastNames = ["Smith", "Johnson", "Williams", "Jones", "Brown", "Davis", "Miller", "Wilson", "Moore", "Taylor", "Patel", "Sharma", "Singh", "Kumar", "Gupta"];
const cities = ["New York", "London", "San Francisco", "Mumbai", "Bangalore", "Delhi", "Pune", "Austin", "Seattle", "Chicago", "Boston"];
const companies = ["Tech Corp", "Builder Bros", "Silent Era Ltd", "Acme Corp", "Global Tech", "Stark Industries", "Wayne Ent", "LexCorp", "Umbrella Corp", "Cyberdyne"];
const statuses = ["GOOD_LEAD_FOLLOW_UP", "DID_NOT_CONNECT", "BAD_LEAD", "SALE_DONE", "", "", ""];
const sources = ["leads_on_demand", "meridian_tower", "eden_park", "varah_swamy", "sarjapur_plots", "", ""];
const notes = ["Client wants a sea-facing apartment", "Called twice, didn't pick up", "Just looking for investment", "Payment received", "Not interested anymore", "Need to schedule a follow up call", "Send more details via email", ""];

// 1. Facebook Leads
let fbCsv = `"id","created_time","ad_id","ad_name","adset_id","adset_name","campaign_id","campaign_name","form_id","form_name","is_organic","platform","full_name","phone_number","email","job_title","company_name","city"\n`;
for (let i = 0; i < 60; i++) {
    const fn = randElement(firstNames);
    const ln = randElement(lastNames);
    const date = `2026-${pad(randInt(1, 12))}-${pad(randInt(1, 28))}T${pad(randInt(0, 23))}:${pad(randInt(0, 59))}:00+0000`;
    const phone = `+1-555-${pad(randInt(100, 999))}${pad(randInt(10, 99))}`;
    const hasContact = Math.random() > 0.1; // 90% have contact info
    fbCsv += `"${10000+i}","${date}","${2300+randInt(1,50)}","Promo_${randInt(1,5)}","123","Adset_${randInt(1,3)}","456","Campaign_${randInt(1,2)}","789","Lead Gen","false","${randElement(['fb','ig'])}","${fn} ${ln}","${hasContact ? phone : ''}","${hasContact ? fn.toLowerCase()+'@'+randElement(['gmail.com','yahoo.com','example.com']) : ''}","Manager","${randElement(companies)}","${randElement(cities)}"\n`;
}
fs.writeFileSync('d:/GrowEasy_Assignment/facebook_leads_export.csv', fbCsv);

// 2. Real Estate CRM
let reCsv = `"Lead Entry Date","Prospect Name","Primary Email","Secondary Email","Mobile 1","Mobile 2","Property Interested In","Possession Needed By","Lead Quality","Notes/Remarks","Assigned Agent"\n`;
for (let i = 0; i < 60; i++) {
    const fn = randElement(firstNames);
    const ln = randElement(lastNames);
    const date = `06/${pad(randInt(1, 28))}/2026`;
    const phone1 = `91-98765${pad(randInt(10, 99))}${pad(randInt(10, 99))}`;
    const phone2 = Math.random() > 0.7 ? `91-99887${pad(randInt(10, 99))}${pad(randInt(10, 99))}` : "";
    const hasContact = Math.random() > 0.05;
    reCsv += `"${date}","${fn} ${ln}","${hasContact ? fn.toLowerCase()+'.'+ln.toLowerCase()+'@realmail.com' : ''}","","${hasContact ? phone1 : ''}","${phone2}","${randElement(sources)}","${randElement(["Immediate", "End of 2026", "Q1 2027", ""])}","${randElement(["Hot", "Cold", "Warm", ""])}","${randElement(notes)}","agent@groweasy.ai"\n`;
}
fs.writeFileSync('d:/GrowEasy_Assignment/real_estate_crm.csv', reCsv);

// 3. Messy Sales Report
let messyCsv = `"Date Added","Client","Contact Details","Location","Where From?","Status Update","Extra Info"\n`;
for (let i = 0; i < 60; i++) {
    const fn = randElement(firstNames);
    const ln = randElement(lastNames);
    const comp = randElement(companies);
    const date = `May ${randInt(1, 31)}, 2026`;
    const hasContact = Math.random() > 0.15;
    const email = `${fn.toLowerCase()}@${comp.replace(' ', '').toLowerCase()}.com`;
    const phone = `555-${pad(randInt(1000, 9999))}`;
    let contactStr = hasContact ? `${email} / ${phone}` : "No contact info";
    if (hasContact && Math.random() > 0.8) contactStr = email; // only email
    if (hasContact && Math.random() > 0.8) contactStr = phone; // only phone
    messyCsv += `"${date}","${comp} (${fn} ${ln})","${contactStr}","${randElement(cities)}","${randElement(['Organic Search', 'Referral', 'Facebook', ''])}","${randElement(statuses)}","${randElement(notes)}"\n`;
}
fs.writeFileSync('d:/GrowEasy_Assignment/messy_sales_report.csv', messyCsv);

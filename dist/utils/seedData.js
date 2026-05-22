"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.seedNotificationTemplates = seedNotificationTemplates;
exports.seedTermsAndPolicy = seedTermsAndPolicy;
exports.seedEmailTemplates = seedEmailTemplates;
exports.seedProjectBlogs = seedProjectBlogs;
exports.seedReviews = seedReviews;
exports.seedExecutiveStaff = seedExecutiveStaff;
const NotificationTemplate_1 = require("../models/NotificationTemplate");
const EmailTemplate_1 = require("../models/EmailTemplate");
const Term_1 = require("../models/Term");
const Blog_1 = require("../models/Blog");
const Review_1 = require("../models/Review");
const Staff_1 = require("../models/Staff");
const NOTIFICATION_TEMPLATES = [
    {
        name: "verification_approved",
        title: "KYC Verification Approved",
        content: "Hello {{username}}, congratulations! Your KYC identity verification has been reviewed and approved by our compliance team. Your account is now fully verified and you have unrestricted access to all platform features, including higher withdrawal limits, exclusive investment tranches, and priority support. Welcome to the verified investor tier. — Capricorn Energy Ltd Compliance Team",
    },
    {
        name: "verification_rejected",
        title: "KYC Verification Rejected",
        content: "Hello {{username}}, your account verification was not approved. Reason: {{reason}}. Please review your details and resubmit.",
    },
    {
        name: "verification_processing",
        title: "Verification Under Review",
        content: "Hello {{username}}, thanks for the effort of verifying your {{company_name}} account. Your verification is currently in review and will take 24 hours for review completion, you will be notified upon approval.",
    },
    {
        name: "investment_complete",
        title: "Investment Completed — {{planName}}",
        content: "Hello {{username}}, your {{planName}} investment of {{amount}} {{currencySymbol}} has successfully completed its {{planDuration}}-day cycle. Your principal capital of {{amount}} {{currencySymbol}} has been returned to your {{currencyName}} wallet balance. Total earnings generated over the investment period: +{{totalEarned}} {{currencySymbol}}. Your funds are now available for withdrawal or reinvestment. Thank you for investing with Capricorn Energy Ltd.",
    },
];
// Format: first line = section heading, rest = body (terms page splits on first \n\n)
const TERMS_SECTIONS = [
    {
        category: "terms",
        content: "Acceptance of Terms\n\nBy accessing, registering, or using the Capricorn Energy Ltd investment platform ('Platform'), you confirm that you have read, understood, and agree to be bound by these Terms and Conditions. If you do not agree to these terms, you must discontinue use of the Platform immediately. Capricorn Energy Ltd reserves the right to amend these terms at any time, and continued use of the Platform constitutes acceptance of any modifications.",
    },
    {
        category: "terms",
        content: "Eligibility & KYC Requirements\n\nUse of the Platform is restricted to individuals who are at least 18 years of age. All investors are required to complete our Know Your Customer (KYC) verification process, which includes submission of a valid government-issued identification document. Capricorn Energy Ltd reserves the right to refuse service, suspend, or terminate accounts that fail to meet our compliance standards or provide false information during verification.",
    },
    {
        category: "terms",
        content: "Investment Plans & Capital Allocation\n\nBy selecting and funding an active investment tranche, investors agree to a fixed lock-in duration as specified in the chosen plan. Funds committed to active deposits are allocated into physically collateralized energy infrastructure projects including oil and gas pipelines, carbon capture systems, and renewable energy grids. Early liquidation of locked capital is not permitted prior to the plan's maturity date.",
    },
    {
        category: "terms",
        content: "Returns & Daily Dividend Distribution\n\nDaily ROI dividends are calculated based on the percentage rate associated with the investor's selected plan and credited to the investor's wallet ledger in real time. Capricorn Energy Ltd does not guarantee specific returns beyond the stated plan rates and holds no liability for losses arising from external market disruptions, force majeure events, or systemic financial crises.",
    },
    {
        category: "terms",
        content: "Withdrawals & Transaction Processing\n\nWithdrawal requests are subject to review and approval by Capricorn Energy Ltd's compliance and finance teams. Processing times may vary between 24 and 72 business hours depending on the withdrawal method, amount, and compliance review status. The Platform reserves the right to withhold or delay withdrawals pending identity verification, compliance review, or suspected fraudulent activity.",
    },
    {
        category: "terms",
        content: "Referral Programme\n\nCapricorn Energy Ltd operates a referral commission programme that rewards existing verified investors for introducing new users to the Platform. Referral bonuses are disbursed upon the successful activation of a qualifying investment plan by the referred user. Commission rates are subject to change, and Capricorn Energy Ltd reserves the right to modify or discontinue the programme at any time.",
    },
    {
        category: "terms",
        content: "Account Security & Responsibility\n\nInvestors are solely responsible for maintaining the confidentiality of their account credentials, including username, password, and two-factor authentication codes. Capricorn Energy Ltd will never solicit your password or private keys. Any unauthorized access must be reported to our support team immediately. The Platform bears no liability for losses resulting from compromised accounts due to investor negligence.",
    },
    {
        category: "terms",
        content: "Prohibited Activities\n\nThe following activities are strictly prohibited on the Platform: money laundering, terrorist financing, fraud, market manipulation, unauthorized scraping of platform data, use of automated bots to perform transactions, creation of multiple accounts, and any activity that violates applicable law. Violation of these prohibitions will result in immediate account termination and may be reported to relevant law enforcement authorities.",
    },
    {
        category: "terms",
        content: "Intellectual Property\n\nAll content on the Platform, including but not limited to logos, graphics, software, text, and data architectures, is the exclusive intellectual property of Capricorn Energy Ltd or its licensors. No content may be reproduced, distributed, or modified without prior written consent from Capricorn Energy Ltd. Unauthorized use of the Platform's intellectual assets may result in legal action.",
    },
    {
        category: "terms",
        content: "Limitation of Liability\n\nTo the maximum extent permitted by applicable law, Capricorn Energy Ltd, its directors, officers, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or investments, arising from the use of the Platform. The Platform's total aggregate liability to any investor shall not exceed the total amount invested by that investor in the preceding 12-month period.",
    },
    {
        category: "terms",
        content: "Governing Law & Dispute Resolution\n\nThese Terms and Conditions are governed by and construed in accordance with the laws of England and Wales. Any disputes arising from or related to the use of the Platform shall first be subject to good-faith negotiation. If unresolved within 30 days, disputes shall be submitted to binding arbitration in accordance with the rules of the London Court of International Arbitration (LCIA).",
    },
    {
        category: "terms",
        content: "Changes to Terms & Conditions\n\nCapricorn Energy Ltd reserves the right to modify, update, or replace any part of these Terms and Conditions at any time. Changes will be effective immediately upon posting to the Platform. We will endeavour to notify registered investors of material changes via email or in-platform notification. Your continued use of the Platform after any changes constitutes your acceptance of the updated terms.",
    },
    // Privacy Policy
    {
        category: "policy",
        content: "Introduction\n\nCapricorn Energy Ltd ('Company', 'we', 'us', or 'our') is committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal data when you access or use our investment Platform. By using the Platform, you consent to the data practices described in this Policy.",
    },
    {
        category: "policy",
        content: "Information We Collect\n\nWe collect information that you provide directly to us during registration and KYC verification, including your full name, date of birth, gender, nationality, country of residence, occupation, email address, and government-issued identification documents. We also collect usage data, transaction history, and device information automatically when you interact with the Platform.",
    },
    {
        category: "policy",
        content: "Know Your Customer (KYC) Data\n\nAs part of our regulatory compliance obligations, we collect and process identity verification documents including passports, voter registration cards, and driving licences. This data is collected solely for the purpose of verifying your identity, preventing financial crime, and ensuring compliance with anti-money laundering (AML) regulations. KYC data is stored securely and is not shared with third parties except where required by law or regulatory mandate.",
    },
    {
        category: "policy",
        content: "How We Use Your Information\n\nWe use the information we collect to: create and manage your investor account; process deposits, withdrawals, and transactions; verify your identity for compliance purposes; send you platform notifications, transaction receipts, and administrative emails; improve our Platform and develop new features; detect, prevent, and investigate fraudulent or illegal activities; and comply with legal and regulatory obligations.",
    },
    {
        category: "policy",
        content: "Data Sharing & Third Parties\n\nWe do not sell your personal data to third parties. We may share your information with our technology service providers who assist in platform operations (under strict data processing agreements); regulatory authorities, law enforcement, or government agencies where required by law; fraud prevention and identity verification services; and email communication providers. All third-party processors are contractually bound to protect your data.",
    },
    {
        category: "policy",
        content: "Data Security\n\nWe implement industry-standard security measures to protect your personal information from unauthorized access, disclosure, alteration, or destruction. These measures include SSL/TLS encryption for all data in transit, encrypted storage of sensitive identification data, role-based access controls for internal staff, and regular security audits. While we strive to protect your data, no method of transmission over the internet is 100% secure.",
    },
    {
        category: "policy",
        content: "Data Retention\n\nWe retain your personal information for as long as your account remains active and for a period of up to seven (7) years thereafter, as required by applicable financial regulations and anti-money laundering legislation. Upon account deletion, we will securely destroy or anonymise your personal data, except where retention is required by law.",
    },
    {
        category: "policy",
        content: "Your Rights\n\nDepending on your jurisdiction, you may have the following rights regarding your personal data: the right to access a copy of your personal information; the right to correct inaccurate or incomplete data; the right to request deletion of your data subject to legal retention obligations; the right to object to or restrict processing; and the right to data portability. To exercise any of these rights, please contact our Data Protection Officer at privacy@capricornenergyltd.online.",
    },
    {
        category: "policy",
        content: "Cookies & Tracking Technologies\n\nThe Platform uses cookies and similar tracking technologies to enhance your user experience, maintain session security, and analyse usage patterns. You may configure your browser to reject cookies, but doing so may affect the functionality of certain platform features. We do not use cookies for advertising purposes or to track you across third-party websites.",
    },
    {
        category: "policy",
        content: "Contact & Policy Updates\n\nThis Privacy Policy may be updated periodically to reflect changes in our data practices or legal requirements. We will notify you of material changes via email or in-platform notification. If you have questions or concerns about this Privacy Policy or how we handle your personal data, please contact us at: privacy@capricornenergyltd.online or write to Capricorn Energy Ltd, Data Protection Office, London, United Kingdom.",
    },
];
async function seedNotificationTemplates() {
    for (const tpl of NOTIFICATION_TEMPLATES) {
        const exists = await NotificationTemplate_1.NotificationTemplate.findOne({ name: tpl.name });
        if (!exists) {
            await NotificationTemplate_1.NotificationTemplate.create(tpl);
            console.log(`[Seed] Notification template "${tpl.name}" created.`);
        }
    }
}
async function seedTermsAndPolicy() {
    const existing = await Term_1.Term.countDocuments();
    if (existing > 0)
        return; // Only seed if collection is empty
    await Term_1.Term.insertMany(TERMS_SECTIONS);
    console.log(`[Seed] Inserted ${TERMS_SECTIONS.length} Terms & Policy records.`);
}
const EMAIL_TEMPLATES = [
    {
        name: "forgot_password",
        title: "Your Password Reset Code — Capricorn Energy Ltd",
        greeting: "Hi {{username}},",
        content: `<p style="margin:0 0 20px;">We received a request to reset the password on your <strong>Capricorn Energy Ltd</strong> investment account. Use the 6-digit verification code below to proceed with your password reset.</p>

<div style="text-align:center; margin: 32px 0;">
  <div style="display:inline-block; background:#0d0e12; border: 1px solid rgba(228,193,38,0.4); border-radius:10px; padding: 24px 40px;">
    <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:3px; color:#888; text-transform:uppercase;">Verification Code</p>
    <span style="font-size:42px; font-weight:900; letter-spacing:14px; color:#e4c126; font-family:monospace; display:block; line-height:1;">{{otp}}</span>
    <p style="margin:12px 0 0; font-size:11px; color:#666;">Expires in 15 minutes</p>
  </div>
</div>

<p style="margin:0 0 16px;">Enter this code on the verification page to create a new password. For your security, this code can only be used once and expires after <strong>15 minutes</strong>.</p>

<p style="margin:0; font-size:13px; color:#888;">If you did not request a password reset, you can safely disregard this message. Your account remains fully secure and no changes have been made.</p>`,
    },
    {
        name: "investment_complete",
        title: "Investment Plan Completed — {{planName}}",
        greeting: "Hi {{username}},",
        content: `<p style="margin:0 0 20px;">Great news! Your <strong>{{planName}}</strong> investment plan on <strong>Capricorn Energy Ltd</strong> has successfully completed its full duration. Your principal capital has been returned to your wallet balance and is immediately available for withdrawal or reinvestment.</p>

<div style="background:#f8f9fa; border:1px solid #e8e8e8; border-radius:8px; padding:24px; margin:28px 0;">
  <p style="margin:0 0 6px; font-size:11px; font-weight:700; letter-spacing:2px; color:#888; text-transform:uppercase;">Investment Summary</p>
  <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-top:14px;">
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; color:#555;">Plan</td>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; font-weight:700; color:#1a1a1a; text-align:right;">{{planName}}</td>
    </tr>
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; color:#555;">Principal Returned</td>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; font-weight:700; color:#1a1a1a; text-align:right;">{{amount}} {{currencySymbol}}</td>
    </tr>
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; color:#555;">Daily Return Rate</td>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; font-weight:700; color:#1a1a1a; text-align:right;">{{planPercentage}}% / day</td>
    </tr>
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; color:#555;">Duration</td>
      <td style="padding:10px 0; border-bottom:1px solid #e8e8e8; font-size:13px; font-weight:700; color:#1a1a1a; text-align:right;">{{planDuration}} days</td>
    </tr>
    <tr>
      <td style="padding:10px 0; font-size:14px; font-weight:700; color:#1a1a1a;">Total Earnings Generated</td>
      <td style="padding:10px 0; font-size:14px; font-weight:900; color:#c8a70e; text-align:right;">+{{totalEarned}} {{currencySymbol}}</td>
    </tr>
  </table>
</div>

<p style="margin:0 0 16px;">Your capital of <strong>{{amount}} {{currencySymbol}}</strong> is now back in your <strong>{{currencyName}}</strong> wallet balance. Log in to your dashboard to withdraw your funds or start a new investment cycle.</p>

<div style="text-align:center; margin:28px 0;">
  <a href="{{dashboardUrl}}" style="display:inline-block; background:#e4c126; color:#1a1a1a; font-weight:900; font-size:13px; letter-spacing:1px; text-transform:uppercase; padding:14px 32px; border-radius:4px; text-decoration:none;">VIEW MY DASHBOARD</a>
</div>

<p style="margin:0; font-size:13px; color:#888;">Thank you for investing with Capricorn Energy Ltd. We look forward to powering your next investment cycle.</p>`,
    },
    {
        name: "two_factor_auth",
        title: "Your 2FA Login Code — Capricorn Energy Ltd",
        greeting: "Hi {{username}},",
        content: `<p style="margin:0 0 20px;">A sign-in attempt was made to your <strong>Capricorn Energy Ltd</strong> investment account. As two-factor authentication is enabled, please use the code below to complete your login.</p>

<div style="text-align:center; margin: 32px 0;">
  <div style="display:inline-block; background:#0d0e12; border: 1px solid rgba(228,193,38,0.4); border-radius:10px; padding: 24px 40px;">
    <p style="margin:0 0 8px; font-size:11px; font-weight:700; letter-spacing:3px; color:#888; text-transform:uppercase;">2FA Code</p>
    <span style="font-size:42px; font-weight:900; letter-spacing:14px; color:#e4c126; font-family:monospace; display:block; line-height:1;">{{otp}}</span>
    <p style="margin:12px 0 0; font-size:11px; color:#666;">Expires in 10 minutes</p>
  </div>
</div>

<p style="margin:0 0 16px;">Enter this code on the verification page to access your portfolio dashboard. This code expires in <strong>10 minutes</strong> and is valid for a single use only.</p>

<p style="margin:0; font-size:13px; color:#888;">If you did not attempt to sign in, please change your password immediately and contact our support team. Your account security is our priority.</p>`,
    },
];
async function seedEmailTemplates() {
    for (const tpl of EMAIL_TEMPLATES) {
        const exists = await EmailTemplate_1.EmailTemplate.findOne({ name: tpl.name });
        if (!exists) {
            await EmailTemplate_1.EmailTemplate.create(tpl);
            console.log(`[Seed] Email template "${tpl.name}" created.`);
        }
    }
}
const PROJECT_BLOGS = [
    {
        category: "Project",
        title: "North Sea Carbon Capture Offshore Platform",
        subtitle: "A state-of-the-art offshore carbon capture installation anchored 340 km off the coast of Bergen, Norway, extracting and sequestering 1.2 million tonnes of CO₂ annually from adjacent production wells.",
        picture: "https://images.unsplash.com/photo-1586952518485-11b180e92764?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2026-04-12",
        content: `<p>The North Sea Carbon Capture Offshore Platform represents Capricorn Energy Ltd's flagship investment in integrated subsea carbon management. Positioned 340 kilometres west of Bergen in Norwegian territorial waters, the installation spans four interconnected semi-submersible platforms operating in water depths of 380 metres, capturing CO₂ from the Troll and Statfjord production clusters before it can reach the atmosphere.</p>

<p>The facility employs post-combustion amine scrubbing alongside proprietary cryogenic separation units developed in partnership with the Norwegian Institute of Technology. Each processing train has a rated intake capacity of 300,000 tonnes of CO₂ per year, feeding a geological sequestration reservoir in the Utsira saline aquifer — the same formation successfully used in the Sleipner CCS project since 1996. Total operational sequestration capacity reached 1.2 million tonnes annually as of Q1 2026, with Phase II expansion targeting 2.1 million tonnes by late 2027.</p>

<p>From an investment perspective, the project benefits from the Norwegian government's full carbon credit monetisation framework, generating verified Verra Gold Standard credits at prevailing market rates. Combined with the EU Emissions Trading System border adjustment pricing, the platform generates an estimated NOK 2.4 billion in annual carbon revenue. Capricorn Energy Ltd holds a 38% equity stake, with project returns averaging 3.1% daily yield distributed directly to qualifying investor portfolios.</p>

<p>Environmental compliance is maintained through continuous third-party auditing by DNV and Bureau Veritas. Wellhead monitoring buoys transmit real-time seabed integrity telemetry to the Bergen operations centre, ensuring zero leakage certification across all injection intervals. The project achieved OSPAR Convention full compliance in 2024 and holds ISO 27916 certification for CO₂ storage operations.</p>`,
    },
    {
        category: "Project",
        title: "Permian Basin Enhanced Oil Recovery Operations",
        subtitle: "A large-scale enhanced oil recovery programme spanning 48,000 acres of the Permian Basin in Midland, Texas, deploying CO₂ injection technology to unlock residual reserves from mature reservoir formations.",
        picture: "https://images.unsplash.com/photo-1513828583688-c52646db42da?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2026-03-05",
        content: `<p>Capricorn Energy Ltd's Permian Basin Enhanced Oil Recovery programme operates across a 48,000-acre concession straddling Midland and Ector counties in West Texas — the highest-producing oil region in the continental United States. The programme targets the Wolfcamp and Spraberry shale formations through a network of 214 horizontal injection wells, each delivering supercritical CO₂ at pressures exceeding 1,200 psi to mobilise residual oil that conventional primary and secondary recovery methods cannot access.</p>

<p>Daily gross production from the concession averages 64,000 barrels of oil equivalent, supplemented by 18 million standard cubic feet of associated natural gas. Surface processing facilities at the Midland Hub include three-phase separation trains, gas sweetening units, and a 140,000-barrel surge storage terminal connected via pipeline to the Cushing, Oklahoma distribution network. The injection CO₂ is sourced from a dedicated capture plant at the Odessa petrochemical corridor, ensuring a closed-loop carbon balance across the operation.</p>

<p>The project entered commercial production in March 2024 following a 22-month development programme. Independently certified proved plus probable reserves total 180 million barrels of oil equivalent, supporting a minimum 14-year production life. Royalty obligations to the Texas General Land Office are structured at 22.5%, with Capricorn Energy Ltd retaining a 55% working interest alongside consortium partners. Net production revenues are distributed through the platform's active deposit mechanism, generating annualised returns consistent with premium investment tiers.</p>

<p>Regulatory standing is maintained through EPA Class II Underground Injection Control permits renewed annually, and all produced water is managed within a zero-surface-discharge zero-discharge framework using on-site saltwater disposal wells. Greenhouse gas emissions intensity from the operation is independently reported at 8.2 kg CO₂e per barrel of oil equivalent — well below the Permian Basin industry average of 14.3 kg CO₂e.</p>`,
    },
    {
        category: "Project",
        title: "Niger Delta Petroleum Refinery Modernisation",
        subtitle: "A comprehensive upgrade of the Bonny Light petroleum refinery complex in Port Harcourt, increasing throughput capacity to 160,000 barrels per day while cutting flare gas emissions by 85%.",
        picture: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2026-01-20",
        content: `<p>The Niger Delta Petroleum Refinery Modernisation project is Capricorn Energy Ltd's most significant downstream infrastructure investment on the African continent. Located 18 kilometres east of Port Harcourt in Rivers State, Nigeria, the Bonny Light refinery complex originally commissioned in 1989 has undergone a complete engineering overhaul to restore it to full nameplate capacity and bring it into alignment with current international refining standards and environmental benchmarks.</p>

<p>The modernisation programme encompasses the replacement of all four crude distillation units with high-efficiency vacuum distillation columns, installation of a new fluid catalytic cracking unit capable of processing 45,000 barrels per day of residual feedstock, and commissioning of a continuous catalytic reforming unit to maximise high-octane gasoline yield. Throughput capacity has increased from a degraded 60,000 barrels per day at project inception to the design rating of 160,000 barrels per day following completion of Phase III works in November 2025.</p>

<p>The flare gas recovery system — a central component of the modernisation — captures associated gas that was previously combusted in open flare stacks. Three booster compressor stations route the recovered gas into a 42-kilometre pipeline feeding the Eleme Petrochemicals Complex, generating LPG, propylene, and ethylene feedstock for domestic industrial consumption. This alone eliminates 620,000 tonnes of CO₂-equivalent annual emissions, qualifying the project for UNFCCC Clean Development Mechanism carbon credits marketed across European compliance markets.</p>

<p>Capricorn Energy Ltd holds a 42% project equity stake under a production sharing agreement with the Nigerian National Petroleum Company Limited. Operational cash flows from refined product sales — including premium motor spirit, automotive gas oil, and jet fuel — are distributed to investors through the platform's yield mechanism. The project operates under a Department of Petroleum Resources operating licence valid through 2041 and maintains full NUPRC compliance for all environmental discharge parameters.</p>`,
    },
    {
        category: "Project",
        title: "Persian Gulf LNG Export Terminal — Ruwais Bay",
        subtitle: "A deep-water liquefied natural gas terminal on Ruwais Bay, Abu Dhabi, capable of processing 8 million tonnes per annum for European and Asian offtake markets through 2040.",
        picture: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2025-11-14",
        content: `<p>The Ruwais Bay LNG Export Terminal is a flagship downstream gas project co-developed by Capricorn Energy Ltd and Abu Dhabi National Energy Company (TAQA) on a 240-hectare industrial marine site on the southern edge of Ruwais Bay, approximately 240 kilometres west of Abu Dhabi city. The terminal receives pipeline-quality gas feed from the Habshan-5 gas processing complex, converts it to liquefied form at minus 162 degrees Celsius, and loads it onto LNG carriers bound for receiving terminals in Spain, the Netherlands, Japan, and South Korea.</p>

<p>The facility comprises two LNG production trains each rated at 4 million tonnes per annum, four full containment storage tanks of 180,000 cubic metres capacity each, and two offshore loading berths capable of accommodating Q-Flex and Q-Max class LNG tankers. Train 1 achieved first LNG production in June 2025 and has operated at 101% utilisation since commissioning. Train 2 entered commercial operations in February 2026, bringing the terminal to its combined nameplate capacity of 8 million tonnes per annum — making it the fourth largest LNG export facility in the Middle East.</p>

<p>All production volumes are sold under long-term Sale and Purchase Agreements with Repsol, Shell, and JERA spanning 15 to 20-year terms, providing cashflow certainty that directly underpins yield distributions to Capricorn Energy Ltd investor accounts. Terminal revenue streams include capacity reservation fees, throughput tolls, and spot market premiums during peak winter demand periods in European markets. The project has been awarded an investment-grade BBB+ rating by Moody's and S&P, reflecting its contracted revenue profile and sovereign-backed offtake arrangements.</p>

<p>Environmental certifications include ISO 14001 Environmental Management System accreditation, Abu Dhabi Environment Agency compliance certification, and registration under the UAE's National Greenhouse Gas Inventory. The terminal employs air-cooled heat exchangers throughout, eliminating the thermal discharge associated with seawater-cooled LNG facilities, and has committed to achieving net-zero Scope 1 and 2 emissions from terminal operations by 2030 through electrification and green hydrogen co-firing programmes.</p>`,
    },
    {
        category: "Project",
        title: "Alberta Oil Sands Carbon Sequestration Facility",
        subtitle: "An integrated carbon capture and permanent geological sequestration plant within the Athabasca Oil Sands region, Fort McMurray, capturing 900,000 tonnes of CO₂ per year from bitumen extraction and upgrading processes.",
        picture: "https://images.unsplash.com/photo-1605791636860-7ddc1b8fd31e?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2025-09-08",
        content: `<p>Capricorn Energy Ltd's Alberta Oil Sands Carbon Sequestration Facility is the company's largest North American CCS investment, situated 22 kilometres north of Fort McMurray within the Athabasca Oil Sands deposit — the world's third-largest proven crude oil reserve. The facility captures CO₂ generated by steam-assisted gravity drainage (SAGD) operations and bitumen upgrading activities at four adjacent oil sands production sites, compresses it to supercritical state, and permanently injects it into the deep Basal Cambrian Sands aquifer formation at depths exceeding 2,200 metres.</p>

<p>The capture plant processes flue gas from steam generation units, upgrader hydrogen plants, and cogeneration facilities simultaneously. Post-combustion capture columns using Cansolv amine solvent achieve a CO₂ capture efficiency of 93% across all process streams. Captured CO₂ is dehydrated, compressed in five-stage intercooled compressors to 145 bar, and transported via a 67-kilometre carbon dioxide pipeline to the injection site at Leduc-Woodbend. Since entering full operations in Q3 2025, the facility has permanently sequestered over 700,000 tonnes of CO₂ — independently verified by the Alberta Energy Regulator.</p>

<p>The project generates Alberta Carbon Offset credits under the Technology Innovation and Emissions Reduction (TIER) regulation, valued and sold quarterly to oil sands producers who require compliance credits under the provincial carbon pricing framework. Federal Clean Fuel Regulations credits are additionally generated and sold bilaterally to fuel distributors in Ontario and British Columbia. Combined credit revenues, plus capacity fees from the four host production sites, generate a project-level IRR exceeding 14.8% over the 25-year asset life. Capricorn Energy Ltd holds a 47% equity interest alongside Canadian Natural Resources Limited and Suncor Energy Inc.</p>

<p>Subsurface integrity is monitored through a network of 18 observation wells and continuous 4D seismic surveys conducted biannually. All monitoring data is submitted quarterly to Natural Resources Canada and the Alberta Energy Regulator in accordance with the Carbon Capture and Storage Statutes Amendment Act. The facility holds International Organization for Standardization ISO 27914 certification for geological storage of CO₂ and has passed all third-party integrity audits conducted since commissioning.</p>`,
    },
    {
        category: "Project",
        title: "Caspian Sea Offshore Subsea Pipeline Network",
        subtitle: "A 340-kilometre subsea pipeline corridor across the northern Caspian Sea connecting Kashagan field production sites to the Aktau marine terminal in Kazakhstan for onward European export.",
        picture: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=1200&q=80",
        author: "Capricorn Energy Ltd",
        date: "2025-07-22",
        content: `<p>The Caspian Sea Offshore Subsea Pipeline Network is a critical midstream infrastructure investment connecting crude oil and associated gas production from the Kashagan offshore field — one of the world's largest oil discoveries — to the Aktau Marine Terminal on the eastern coast of Kazakhstan. Capricorn Energy Ltd leads the pipeline consortium alongside KazMunayGas, Shell, and Total Energies, holding a 28% equity interest in the 340-kilometre subsea corridor that forms the primary export route for Kashagan production volumes targeting European markets.</p>

<p>The pipeline system comprises twin 32-inch-diameter carbon steel lines installed at seabed depths of up to 25 metres across the shallow northern Caspian shelf. Total throughput capacity is 900,000 barrels per day of crude oil and 280 million standard cubic feet per day of associated gas, sized to accommodate full Phase 2 Kashagan plateau production volumes. The crude oil line operates under full cathodic protection with continuous corrosion monitoring via electrical resistance probes; the gas line employs inline inspection pigging runs on a six-month cycle. Both pipelines are equipped with automated shut-off valves at 15-kilometre intervals to contain any leakage within minimal isolation segments.</p>

<p>The Aktau Marine Terminal at the western terminus of the pipeline receives crude into six floating roof storage tanks totalling 2.1 million barrels of operational capacity. Tanker loading operations serve the Aktau-Baku ferry crossing and the Caspian Pipeline Consortium's Novorossiysk terminal on the Black Sea, from which crude flows onward to Mediterranean refineries and northern European terminals. Throughput fees — denominated in USD and indexed to Brent crude — are charged to all shippers under 15-year firm transportation agreements, generating stable cashflow irrespective of commodity price movements.</p>

<p>Environmental safeguards on the Caspian system are among the most stringent of any offshore pipeline in the former Soviet space. The project operates under the Caspian Environmental Programme framework and the Convention on the Protection of the Marine Environment of the Caspian Sea (Tehran Convention). Cathodic protection current density is maintained within Nace SP0169 specification, and subsea inspection dives are conducted quarterly at all critical weld joints. Spill response equipment is pre-positioned at Aktau and at the midpoint service buoy, with a Tier 2 oil spill response capability certified by Det Norske Veritas.</p>`,
    },
];
async function seedProjectBlogs() {
    const existing = await Blog_1.Blog.countDocuments({ category: "Project" });
    if (existing > 0)
        return; // Only seed if no project blogs exist
    await Blog_1.Blog.insertMany(PROJECT_BLOGS);
    console.log(`[Seed] Inserted ${PROJECT_BLOGS.length} Project blog records.`);
}
// ─── Testimonials (Reviews) ────────────────────────────────────────────────────
const SEED_REVIEWS = [
    {
        fullName: "James Whitfield",
        content: "Capricorn Energy Ltd transformed how I think about long-term capital deployment. The quarterly earnings reports are transparent, the support team is genuinely responsive, and my portfolio has grown 22% over 14 months. I've recommended this platform to two colleagues in private equity and they've had identical experiences.",
        rating: 5,
        country: "United States",
        countryFlag: "🇺🇸",
        userPicture: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
    {
        fullName: "Sophie Harrington",
        content: "I was sceptical about energy-backed investment platforms after a poor experience elsewhere, but Capricorn's onboarding process immediately set a different tone. The KYC process was seamless, my first active deposit was confirmed within 24 hours, and the returns have been consistent with every projection they shared at sign-up. Excellent platform.",
        rating: 5,
        country: "United Kingdom",
        countryFlag: "🇬🇧",
        userPicture: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
    {
        fullName: "Marcus Devereux",
        content: "The level of due diligence Capricorn Energy Ltd puts into each project is remarkable. I've reviewed several of the project briefs they publish and the underlying infrastructure assets are real, documented, and audited. As someone who manages a small family office, I need confidence in my counterparties. Capricorn delivers exactly that.",
        rating: 5,
        country: "Canada",
        countryFlag: "🇨🇦",
        userPicture: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
    {
        fullName: "Anika Hoffmann",
        content: "Ich habe mit verschiedenen Plattformen experimentiert, aber keine hat die Kombination aus Professionalität, Rendite und Transparenz geboten, die Capricorn Energy Ltd bietet. Die Dashboard-Übersicht ist intuitiv und meine Erträge werden pünktlich und vollständig ausbezahlt. Absolut empfehlenswert für anspruchsvolle Investoren.",
        rating: 5,
        country: "Germany",
        countryFlag: "🇩🇪",
        userPicture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
    {
        fullName: "Liam Nguyen",
        content: "Three things convinced me to increase my allocation with Capricorn: the real-time portfolio dashboard, the prompt response from their client relations team, and the verified track record on oil and gas project returns. I've been with the platform for 18 months and have never had a delayed payment. That speaks volumes.",
        rating: 5,
        country: "Australia",
        countryFlag: "🇦🇺",
        userPicture: "https://images.unsplash.com/photo-1463453091185-61582044d556?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
    {
        fullName: "Priya Mehta",
        content: "Capricorn Energy Ltd stands out in a crowded market because they back their returns with tangible assets — offshore pipelines, LNG terminals, carbon capture facilities. As an analyst by profession, I scrutinise every disclosure carefully. Their documentation is thorough, their projections are conservative, and their actual performance consistently exceeds stated targets.",
        rating: 5,
        country: "Singapore",
        countryFlag: "🇸🇬",
        userPicture: "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=200&q=80",
        isApproved: true,
    },
];
async function seedReviews() {
    const existing = await Review_1.Review.findOne({ fullName: "James Whitfield" });
    if (existing)
        return;
    await Review_1.Review.insertMany(SEED_REVIEWS);
    console.log(`[Seed] Inserted ${SEED_REVIEWS.length} testimonial records.`);
}
// ─── Executive Staff ───────────────────────────────────────────────────────────
const SEED_STAFF = [
    {
        name: "Richard Ashcroft",
        position: "Chief Executive Officer",
        description: "Capricorn Energy Ltd offers investors direct exposure to high-yield, asset-backed oil and gas infrastructure projects across four continents, with a proven track record of delivering above-market returns and protecting capital through every commodity cycle.",
        picture: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
    },
    {
        name: "Catherine Osei",
        position: "Chief Financial Officer",
        description: "Every investor receives fully transparent quarterly earnings reports, real-time portfolio dashboards, and independently audited financial statements — so your capital is always working visibly and verifiably on your behalf.",
        picture: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80",
    },
    {
        name: "David Holbrook",
        position: "Chief Operating Officer",
        description: "All investment projects are monitored in real time against strict operational benchmarks, with on-the-ground contractor governance ensuring every project delivers the promised throughput, timeline, and revenue performance.",
        picture: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
    },
    {
        name: "Elena Vasquez",
        position: "Chief Technology Officer",
        description: "Our proprietary digital monitoring platform gives investors live telemetry from every active project — including pipeline flow rates, carbon capture volumes, and revenue accruals — so you always know exactly what your money is doing.",
        picture: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
    },
    {
        name: "Thomas Bellamy",
        position: "Vice President, Investments",
        description: "Only projects with independently verified IRRs above 12%, existing offtake agreements, and tier-one operator partners are admitted to the portfolio — meaning your capital is only ever allocated to proven, high-conviction opportunities.",
        picture: "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=400&q=80",
    },
    {
        name: "Naomi Adeyemi",
        position: "Head of Legal & Compliance",
        description: "Every investor on the platform is protected by fully documented legal frameworks, rigorous KYC verification, and cross-border regulatory compliance — ensuring your investment is governed by the highest international standards at all times.",
        picture: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80",
    },
];
async function seedExecutiveStaff() {
    for (const member of SEED_STAFF) {
        await Staff_1.Staff.updateOne({ name: member.name }, { $set: member }, { upsert: true });
    }
    console.log(`[Seed] Upserted ${SEED_STAFF.length} executive staff records.`);
}

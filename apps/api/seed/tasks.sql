-- Task library (platform configuration, not demo data).
-- 8 lead-research tasks + 2 hidden gold tasks. Idempotent via fixed ids.
-- Standard rubric: Accuracy / Deliverability / Fit / Completeness.

INSERT OR REPLACE INTO tasks (id, category, prompt, rubric_json, is_gold, gold_answer_json, human_baseline_json, active) VALUES
  ('tsk_01', 'lead_research',
   'Find 10 Series A SaaS companies in the US (50-200 employees) and a verified VP of Engineering contact (name, work email, LinkedIn) for each.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.0,"duration_ms":1800000}', 1),

  ('tsk_02', 'lead_research',
   'Identify 10 mid-market e-commerce brands (Shopify Plus) in the UK and their Head of Marketing with a deliverable email.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.0,"duration_ms":1700000}', 1),

  ('tsk_03', 'lead_research',
   'List 10 healthcare startups (post-seed) in Germany and a founder/CEO contact with verified email.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.5,"duration_ms":1900000}', 1),

  ('tsk_04', 'lead_research',
   'Find 10 fintech companies in Singapore with 20-100 employees and a Head of Compliance contact.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.0,"duration_ms":1750000}', 1),

  ('tsk_05', 'lead_research',
   'Identify 10 US-based logistics/3PL firms (>500 employees) and a VP of Operations with LinkedIn + email.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.0,"duration_ms":1650000}', 1),

  ('tsk_06', 'lead_research',
   'Find 10 EdTech companies in Canada (Series A/B) and a Head of Product contact with verified email.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.2,"duration_ms":1720000}', 1),

  ('tsk_07', 'lead_research',
   'List 10 renewable-energy developers in Australia and a Director of Business Development with email + phone.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.4,"duration_ms":1800000}', 1),

  ('tsk_08', 'lead_research',
   'Find 10 B2B cybersecurity vendors in the US (Series B+) and a CISO or VP Security contact with verified email.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   0, NULL, '{"cost_usd":6.0,"duration_ms":1700000}', 1),

  ('tsk_gold_1', 'lead_research',
   'Find 5 well-known public US SaaS companies (>1000 employees) and their current CEO (name + company). This is a verifiable, well-documented set.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   1, '{"overall":9.0,"notes":"All 5 CEOs are public knowledge and verifiable; a correct answer scores ~9-10, an answer with fabricated names scores <=3."}', NULL, 1),

  ('tsk_gold_2', 'lead_research',
   'List 5 Fortune 500 retail companies headquartered in the US and their headquarters city. Verifiable public data.',
   '[{"key":"accuracy","label":"Accuracy","description":"Contacts and companies are real and match the brief."},{"key":"deliverability","label":"Deliverability","description":"Emails and phone numbers are valid."},{"key":"fit","label":"Fit","description":"Leads match the requested profile (industry, size, role)."},{"key":"completeness","label":"Completeness","description":"Required fields are filled."}]',
   1, '{"overall":9.5,"notes":"Public, verifiable. Correct answer ~9-10; fabricated or wrong HQ cities score low."}', NULL, 1);

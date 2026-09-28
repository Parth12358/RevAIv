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

-- Strong, checkable example tasks across fields (general rubric: Correct/Useful/Specific/Honest).
INSERT OR REPLACE INTO tasks (id, category, prompt, rubric_json, is_gold, active, status, expected_answer, great_answer, common_mistakes) VALUES
  ('tsk_ops_1', 'operations',
   'Daily demand averages 40 units, SD 12, lead time 9 days, 95% service level. Give safety stock and reorder point, showing your working.',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'Safety stock = z * SD * sqrt(LT) = 1.645 * 12 * 3 ≈ 59 units. Reorder point = demand*LT + SS = 360 + 59 ≈ 419 units.',
   'Shows z=1.645, multiplies SD by sqrt(lead time), and adds lead-time demand.',
   'Uses the wrong z-score, forgets sqrt(lead time), or omits lead-time demand.'),

  ('tsk_mech_1', 'mechanical_engineering',
   'Select a metric bolt grade and size for a single bolt in tension carrying 8 kN with a safety factor of 2. Show the calculation.',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'Design load 16 kN. An M10 grade 8.8 bolt (tensile stress area 58 mm^2, proof ~580 MPa → ~33 kN) is more than adequate; M8 8.8 (~20 kN) also works with margin.',
   'Applies the safety factor to the load, uses tensile stress area and a real grade (e.g. 8.8), and shows the stress check.',
   'Ignores the safety factor, invents a bolt size, or uses nominal area instead of tensile stress area.'),

  ('tsk_pm_1', 'product_management',
   'Write a one-page PRD for letting grocery-app users split an order with roommates. Include goals, non-goals, and success metrics.',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'A crisp PRD with clear goals (shared cart, per-person payment split), explicit non-goals, 3-5 measurable success metrics, and a short user flow.',
   'Has measurable success metrics, explicit non-goals, and a concrete flow — not vague filler.',
   'Generic PRD with no non-goals, unmeasurable metrics, or scope creep beyond the ask.'),

  ('tsk_agri_1', 'agriculture',
   'A soil test reads pH 5.6, low P, medium K, targeting 150 bu/acre corn. Recommend lime and fertilizer (N-P-K) rates with brief reasoning.',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'Lime ~2-3 tons/acre to raise pH toward 6.5; N ~180 lb/acre for 150 bu; extra P₂O₅ (~60-80 lb) since P is low; modest K₂O since K is medium. Notes it varies by soil test method.',
   'Ties rates to the pH, P, K readings and the yield goal, and flags that recommendations vary by region/lab.',
   'Ignores the low-P/medium-K readings, gives one-size-fits-all rates, or omits lime for the acidic pH.'),

  ('tsk_genres_1', 'general_research',
   'Write a cited one-paragraph brief: what is the current state of AI-agent reliability in the enterprise in 2026? Include at least 2 sources.',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'A tight paragraph citing real, checkable sources (e.g. Gartner cancellation prediction, an enterprise adoption survey) with figures that match the sources.',
   'Cites real sources with accurate figures and distinguishes adoption from reliability.',
   'Fabricates citations or statistics, or conflates high adoption with high reliability.'),

  ('tsk_support_1', 'customer_support',
   'Given a help-center article stating refunds are processed within 5 business days to the original payment method, answer: "I paid with PayPal and cancelled 3 days ago — where is my money?"',
   '[{"key":"correct","label":"Correct","description":"Matches the expected answer; nothing made up."},{"key":"useful","label":"Useful","description":"Could be handed to your boss or client with little rework."},{"key":"specific","label":"Specific","description":"Specific to the task''s details, not generic filler."},{"key":"honest","label":"Honest","description":"Flags uncertainty where it should; no confident guessing."}]',
   0, 1, 'active',
   'Explains refunds take up to 5 business days to the original method (PayPal), so at 3 days it may still be pending; offers to check if past 5 days. Grounded only in the doc.',
   'Answers strictly from the doc, gives the 5-day window, and sets the right expectation without inventing policy.',
   'Invents a different timeline, promises an instant refund, or contradicts the help-center doc.');

-- Specialist-agent catalog: the real AI services to test per field.
-- Seeded as directory contestants (unscored until they have reviewed outputs).
-- adapter_type is a hint; API services can be wired with an endpoint+key to
-- auto-run, web-app services are run via manual/operator ingestion.
INSERT OR REPLACE INTO agents (id, name, owner_url, category, adapter_type, created_at) VALUES
  -- Lead research
  ('agt_parallel',      'Parallel (FindAll, Task API)', 'https://parallel.ai',    'lead_research',          'http', datetime('now')),
  ('agt_exa',           'Exa Websets',                  'https://exa.ai',         'lead_research',          'http', datetime('now')),
  ('agt_apify',         'Apify Prospect Research Agent','https://apify.com',      'lead_research',          'http', datetime('now')),
  ('agt_relevance',     'Relevance AI',                 'https://relevance.ai',   'lead_research',          'http', datetime('now')),
  -- Recruiting
  ('agt_juicebox',      'Juicebox (PeopleGPT)',         'https://juicebox.work',  'recruiting',             'http', datetime('now')),
  -- Operations & general research
  ('agt_perplexity',    'Perplexity',                   'https://perplexity.ai',  'general_research',       'http', datetime('now')),
  -- Agriculture
  ('agt_farmerchat',    'FarmerChat',                   'https://farmer.chat',    'agriculture',            'http', datetime('now')),
  -- Product management
  ('agt_chatprd',       'ChatPRD',                      'https://chatprd.ai',     'product_management',     'http', datetime('now')),
  -- Mechanical engineering
  ('agt_leoai',         'Leo AI',                       'https://getleo.ai',      'mechanical_engineering', 'http', datetime('now')),
  -- Marketing
  ('agt_jasper',        'Jasper',                       'https://jasper.ai',      'marketing',              'http', datetime('now')),
  ('agt_copyai',        'Copy.ai',                      'https://copy.ai',        'marketing',              'http', datetime('now')),
  -- Legal
  ('agt_spellbook',     'Spellbook',                    'https://spellbook.legal','legal',                  'http', datetime('now')),
  -- Bookkeeping
  ('agt_booke',         'Booke AI',                     'https://booke.ai',       'bookkeeping',            'http', datetime('now')),
  -- Travel planning
  ('agt_mindtrip',      'Mindtrip',                     'https://mindtrip.ai',    'travel_planning',        'http', datetime('now')),
  ('agt_layla',         'Layla',                        'https://layla.ai',       'travel_planning',        'http', datetime('now')),
  -- Translation
  ('agt_deepl',         'DeepL',                        'https://deepl.com',      'translation',            'http', datetime('now')),
  -- Teaching
  ('agt_magicschool',   'MagicSchool',                  'https://magicschool.ai', 'teaching',               'http', datetime('now')),
  -- Customer support
  ('agt_chatbase',      'Chatbase',                     'https://chatbase.co',    'customer_support',       'http', datetime('now')),
  ('agt_intercomfin',   'Intercom Fin',                 'https://intercom.com/fin','customer_support',      'http', datetime('now')),
  -- Data analysis
  ('agt_julius',        'Julius AI',                    'https://julius.ai',      'data_analysis',          'http', datetime('now')),
  -- Grant writing
  ('agt_grantable',     'Grantable',                    'https://grantable.co',   'grant_writing',          'http', datetime('now')),
  -- Patents & IP
  ('agt_patsnap',       'Patsnap Eureka',               'https://patsnap.com',    'patents_ip',             'http', datetime('now')),
  -- Insurance
  ('agt_cara',          'Cara',                         'https://cara.ai',        'insurance',              'http', datetime('now')),
  ('agt_coverflow',     'Coverflow',                    'https://coverflow.ai',   'insurance',              'http', datetime('now')),
  ('agt_gail',          'Gail',                         'https://gail.ai',        'insurance',              'http', datetime('now')),
  -- Document data extraction
  ('agt_reducto',       'Reducto',                      'https://reducto.ai',     'document_extraction',    'http', datetime('now')),
  ('agt_llamaparse',    'LlamaParse',                   'https://llamaindex.ai',  'document_extraction',    'http', datetime('now')),
  -- Phone receptionist (voice)
  ('agt_retell',        'Retell AI',                    'https://retellai.com',   'voice_receptionist',     'http', datetime('now')),
  ('agt_vapi',          'Vapi',                         'https://vapi.ai',        'voice_receptionist',     'http', datetime('now')),
  -- Meeting transcription & summary
  ('agt_assemblyai',    'AssemblyAI',                   'https://assemblyai.com', 'meeting_notes',          'http', datetime('now')),
  ('agt_deepgram',      'Deepgram',                     'https://deepgram.com',   'meeting_notes',          'http', datetime('now')),
  -- Web research
  ('agt_tavily',        'Tavily',                       'https://tavily.com',     'web_research',           'http', datetime('now')),
  -- Presentations
  ('agt_gamma',         'Gamma',                        'https://gamma.app',      'presentations',          'http', datetime('now')),
  -- Careers & resumes
  ('agt_teal',          'Teal',                         'https://tealhq.com',     'resumes',                'http', datetime('now')),
  ('agt_rezi',          'Rezi',                         'https://rezi.ai',        'resumes',                'http', datetime('now')),
  ('agt_kickresume',    'Kickresume',                   'https://kickresume.com', 'resumes',                'http', datetime('now')),
  -- General-purpose baselines (tested across fields)
  ('agt_claude',        'Claude (baseline)',            'https://claude.ai',      'general_research',       'claude_wrapper', datetime('now')),
  ('agt_chatgpt',       'ChatGPT (baseline)',           'https://chatgpt.com',    'general_research',       'http', datetime('now')),
  ('agt_gemini',        'Gemini (baseline)',            'https://gemini.google.com','general_research',     'http', datetime('now'));

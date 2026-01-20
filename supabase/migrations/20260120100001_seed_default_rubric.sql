-- Migration: Seed Default Rubric Configuration
-- Description: Populates the rubric tables with the default First Health Enrollment coaching rubric

-- Insert the default rubric config
INSERT INTO coaching_rubric_config (id, name, description, version, is_active, is_draft)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'First Health Enrollment Standard Rubric',
  'Default coaching rubric based on Script 2.0 for First Health Enrollment sales calls',
  1,
  true,
  false
);

-- Insert categories with weights
INSERT INTO rubric_categories (id, rubric_config_id, name, slug, description, weight, sort_order, is_enabled)
VALUES
  (
    'b0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001',
    'Opening & Rapport',
    'opening_rapport',
    'First impression, compliance intro, consent. Includes agent identification, recording disclosure, and establishing trust.',
    10.00,
    1,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000002',
    'a0000000-0000-0000-0000-000000000001',
    'Needs Discovery & Qualification',
    'needs_discovery',
    'Understanding customer needs, determining ACA vs Limited Medical path based on income qualification.',
    30.00,
    2,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000003',
    'a0000000-0000-0000-0000-000000000001',
    'Product Presentation',
    'product_presentation',
    'Connecting benefits to needs, explaining subsidy, copays, preventative care, dental/vision, and total price.',
    20.00,
    3,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000004',
    'a0000000-0000-0000-0000-000000000001',
    'Objection Handling',
    'objection_handling',
    'Addressing concerns about price, spouse consultation, timing, and maintaining momentum.',
    20.00,
    4,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000005',
    'a0000000-0000-0000-0000-000000000001',
    'Compliance & Disclosures',
    'compliance_disclosures',
    'Required statements, recording disclosure, citizenship verification, CareConnect clarification.',
    10.00,
    5,
    true
  ),
  (
    'b0000000-0000-0000-0000-000000000006',
    'a0000000-0000-0000-0000-000000000001',
    'Closing & Enrollment',
    'closing_enrollment',
    'Collecting information, processing enrollment, consent forms, handoff to verification.',
    10.00,
    6,
    true
  );

-- Insert scoring criteria for Opening & Rapport
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 1, 'Missing multiple required elements. No agent name OR no company name OR no recording disclosure. Jumped straight to questions without establishing context. Customer confused about who is calling or why.'),
  ('b0000000-0000-0000-0000-000000000001', 2, 'Included agent name and company but missed recording disclosure OR consent request. Rushed through introduction. No attempt to build rapport or confirm it is a good time.'),
  ('b0000000-0000-0000-0000-000000000001', 3, 'All required elements present: name, company, state licensing, reason for call, recording disclosure. Asked for consent. Delivery was adequate but mechanical or rushed.'),
  ('b0000000-0000-0000-0000-000000000001', 4, 'Strong introduction with all elements. Natural delivery, not robotic. Confirmed customer availability. Brief rapport-building (used customer name, acknowledged their situation). Created positive first impression.'),
  ('b0000000-0000-0000-0000-000000000001', 5, 'Exceptional opening that immediately built trust. All compliance elements woven in naturally. Personalized the interaction. Set clear expectations for the call. Customer felt welcomed and at ease. Seamlessly transitioned to discovery.');

-- Insert scoring criteria for Needs Discovery & Qualification
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000002', 1, 'Skipped discovery entirely or asked fewer than 3 questions. Jumped to pitch without understanding customer situation. Did not verify income. Pitched wrong product for customer income level.'),
  ('b0000000-0000-0000-0000-000000000002', 2, 'Asked some basic questions (zip, filing status) but missed critical areas like income verification, pre-existing conditions, or medications. Did not reassure customer about pre-existing conditions. May have pitched ACA to someone who did not qualify.'),
  ('b0000000-0000-0000-0000-000000000002', 3, 'Covered most required questions. Verified income and correctly identified ACA vs Limited Medical path. Asked about pre-existing conditions and medications. May have missed doctor preference question or did not dig deep into customer specific needs. Adequate but surface-level discovery.'),
  ('b0000000-0000-0000-0000-000000000002', 4, 'Thorough discovery covering all required areas. Used the pre-existing conditions reassurance (you CANNOT be denied coverage). Asked follow-up questions based on customer responses. Correctly identified product path and transitioned smoothly if Limited Medical was needed. Connected discoveries to later presentation.'),
  ('b0000000-0000-0000-0000-000000000002', 5, 'Exceptional discovery that uncovered not just facts but motivations. Asked all required questions plus insightful follow-ups. Made customer feel heard and understood. Identified specific pain points (medications, doctors, conditions) that were later addressed in presentation. Correctly identified ACA vs Limited Medical and if switching, made the transition feel natural and beneficial, not like a downgrade.');

-- Insert scoring criteria for Product Presentation
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000003', 1, 'Generic presentation that did not connect to customer needs. Missed major benefits (no mention of subsidy, or skipped preventative care, or forgot dental/vision). Used confusing jargon. Customer seemed lost or disengaged.'),
  ('b0000000-0000-0000-0000-000000000003', 2, 'Covered basic elements but presentation felt scripted and impersonal. Mentioned subsidy and some benefits but did not connect them to customer discovered needs (medications, doctors, conditions). Missed dental/vision or accidental death benefits.'),
  ('b0000000-0000-0000-0000-000000000003', 3, 'Solid presentation covering subsidy, copays, preventative care (with appropriate gender examples), deductible, dental, vision, and accidental death. Explained total price. Delivery was clear but did not personalize much to customer specific situation.'),
  ('b0000000-0000-0000-0000-000000000003', 4, 'Strong presentation that referenced customer discovered needs. Connected benefits to their specific medications, doctors, or conditions. Explained subsidy clearly. Used momentum technique effectively. Customer understood the value proposition. Asked clarifying questions or got verbal buy-in during presentation.'),
  ('b0000000-0000-0000-0000-000000000003', 5, 'Exceptional consultative presentation. Wove customer specific pain points throughout (Remember you mentioned X medication? That would be covered with your Y copay). Made complex concepts simple. Built genuine excitement about the coverage. Customer felt this plan was chosen specifically for them, not a one-size-fits-all pitch. Transitioned naturally to close.');

-- Insert scoring criteria for Objection Handling
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000004', 1, 'Ignored objections entirely or argued with customer. Gave up immediately at first pushback. Used high-pressure tactics that made customer uncomfortable. Lost the sale due to poor objection handling.'),
  ('b0000000-0000-0000-0000-000000000004', 2, 'Acknowledged objection but response was generic or weak. Did not uncover the real concern behind the objection. Accepted stalls (I will call you back) without attempting to address or schedule follow-up.'),
  ('b0000000-0000-0000-0000-000000000004', 3, 'Addressed objections adequately. Acknowledged the concern, provided a reasonable response. Did not fully resolve or lost momentum afterward. May have handled one objection well but struggled with follow-up objections.'),
  ('b0000000-0000-0000-0000-000000000004', 4, 'Strong objection handling. Used empathy (I understand), asked clarifying questions to uncover real concerns, and provided specific responses that addressed the root issue. Maintained positive rapport throughout. Successfully redirected to value after addressing concern.'),
  ('b0000000-0000-0000-0000-000000000004', 5, 'Expert-level handling. Anticipated objections before they arose. When objections came, listened fully, validated the concern, asked questions to understand the root cause, and turned the objection into a reason to buy. Customer felt heard and respected, not pressured. Maintained control while making customer feel in control of their decision.');

-- Insert scoring criteria for Compliance & Disclosures
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000005', 1, 'Multiple critical compliance elements missing. No recording disclosure OR no citizenship verification OR made false promises about coverage. High risk of compliance violation.'),
  ('b0000000-0000-0000-0000-000000000005', 2, 'Some compliance elements present but significant gaps. May have rushed through disclosures so fast customer could not understand. Did not clearly explain CareConnect is not health insurance. Skipped verbal confirmations.'),
  ('b0000000-0000-0000-0000-000000000005', 3, 'All critical compliance elements present. Recording disclosure, citizenship verification, CareConnect clarification, verbal confirmations completed. Delivery was adequate but may have felt rushed or like fine print reading.'),
  ('b0000000-0000-0000-0000-000000000005', 4, 'Thorough compliance with clear explanations. Made disclosures feel like helpful information, not legal requirements. Customer understood what they were agreeing to. Proactively clarified limitations. Explained document expectations and timeline clearly.'),
  ('b0000000-0000-0000-0000-000000000005', 5, 'Exceptional compliance execution. All required elements delivered naturally within the conversation flow. Built trust through transparency. Customer felt informed and protected, not confused by disclaimers. Clearly explained CareConnect distinction. Thoroughly covered SEP documentation if applicable. Set proper expectations about next steps.');

-- Insert scoring criteria for Closing & Enrollment
INSERT INTO rubric_scoring_criteria (category_id, score, criteria_text)
VALUES
  ('b0000000-0000-0000-0000-000000000006', 1, 'Call ended without clear outcome. Did not attempt to close. OR collected incomplete information. OR did not transfer to verification. Customer left confused about what happens next.'),
  ('b0000000-0000-0000-0000-000000000006', 2, 'Attempted close but gave up easily at hesitation. Collected some information but missed key elements. Did not explain consent forms properly. Rushed through next steps so customer did not understand what to expect.'),
  ('b0000000-0000-0000-0000-000000000006', 3, 'Solid close with all information collected. Consent forms sent and explained adequately. Verbal confirmations completed. Explained next steps including emails to expect and ID card timeline. Transferred to verification. Process felt mechanical but complete.'),
  ('b0000000-0000-0000-0000-000000000006', 4, 'Strong close with smooth information collection. Made consent forms feel easy, not bureaucratic. Thoroughly explained what emails to expect (especially the THIS IS NOT HEALTH INSURANCE one). Warned about not picking another plan. Mentioned rogue agents. Customer felt confident about next steps. Warm handoff to verification.'),
  ('b0000000-0000-0000-0000-000000000006', 5, 'Exceptional close that felt like a natural conclusion, not a hard sell. Customer eagerly provided information. Consent form process was seamless with clear explanations. Customer understood exactly what happens next, what emails to expect, what NOT to do, and how to get help if needed. Agent saved their number. Customer felt taken care of, not just processed. Confident, professional transfer to verification.');

-- Insert red flags
INSERT INTO rubric_red_flags (rubric_config_id, flag_key, display_name, description, severity, threshold_type, threshold_value, is_enabled, sort_order)
VALUES
  -- Critical severity (immediate manager alert)
  ('a0000000-0000-0000-0000-000000000001', 'ssn_before_citizenship', 'SSN before citizenship verification', 'Collected Social Security Number before verifying citizenship/residency status', 'critical', 'boolean', NULL, true, 1),
  ('a0000000-0000-0000-0000-000000000001', 'missing_recording_disclosure', 'Missing recording disclosure', 'Recording disclosure was completely absent from the call', 'critical', 'boolean', NULL, true, 2),
  ('a0000000-0000-0000-0000-000000000001', 'subsidy_guarantee_no_income', 'Subsidy guarantee without income verification', 'Made guarantees about specific subsidy amounts before verifying income', 'critical', 'boolean', NULL, true, 3),
  ('a0000000-0000-0000-0000-000000000001', 'payment_before_consent', 'Payment before consent forms', 'Collected payment information before sending and explaining consent forms', 'critical', 'boolean', NULL, true, 4),

  -- High priority (flag for review)
  ('a0000000-0000-0000-0000-000000000001', 'aca_without_income', 'ACA pitch without income verification', 'Skipped income verification but still quoted an ACA plan', 'high', 'boolean', NULL, true, 5),
  ('a0000000-0000-0000-0000-000000000001', 'missing_careconnect_clarification', 'Missing CareConnect clarification', 'Did not mention this is NOT health insurance when discussing CareConnect dental/vision benefits', 'high', 'boolean', NULL, true, 6),
  ('a0000000-0000-0000-0000-000000000001', 'missing_rogue_agent_warning', 'Missing rogue agent warning', 'Did not warn customer about rogue agents or duplicate plan picking on healthcare.gov', 'high', 'boolean', NULL, true, 7),
  ('a0000000-0000-0000-0000-000000000001', 'excessive_talk_ratio', 'Excessive talk ratio', 'Agent talk ratio exceeded threshold, indicating monologuing rather than conversation', 'high', 'percentage', 70.00, true, 8),

  -- Medium priority (coaching opportunity)
  ('a0000000-0000-0000-0000-000000000001', 'skipped_health_discovery', 'Skipped health discovery', 'Did not ask about pre-existing conditions or prescription medications', 'medium', 'boolean', NULL, true, 9),
  ('a0000000-0000-0000-0000-000000000001', 'skipped_doctor_preference', 'Skipped doctor preference', 'Did not ask about doctor preferences (priority to keep vs. open to any)', 'medium', 'boolean', NULL, true, 10),
  ('a0000000-0000-0000-0000-000000000001', 'rushed_closing', 'Rushed closing', 'Rushed through closing without completing verbal confirmations', 'medium', 'boolean', NULL, true, 11),
  ('a0000000-0000-0000-0000-000000000001', 'no_enrollment_urgency', 'No enrollment urgency', 'Did not create appropriate urgency around enrollment deadline', 'medium', 'boolean', NULL, true, 12);

// ==========================================
// Internationalisation — PT / EN
// ==========================================

let currentLang = 'en';

const translations = {
  // Header
  header_title: { pt: 'OnCorporate', en: 'OnCorporate' },
  header_subtitle: { pt: 'Portal de Constituição de Sociedade', en: 'Company Incorporation Portal' },
  page_title: { pt: 'OnCorporate — Portal de Constituição de Sociedade', en: 'OnCorporate — Company Incorporation Portal' },

  // Progress steps
  step_society: { pt: 'Sociedade', en: 'Company' },
  step_shareholders: { pt: 'Sócios', en: 'Shareholders' },
  step_managers: { pt: 'Gerentes', en: 'Directors' },
  step_documents: { pt: 'Documentos', en: 'Documents' },
  step_review: { pt: 'Revisão', en: 'Review' },

  // Step 1
  s1_title: { pt: 'Dados da Sociedade', en: 'Company Details' },
  s1_subtitle: { pt: 'Informações básicas sobre a sociedade a constituir.', en: 'Basic information about the company to be incorporated.' },
  s1_welcome: {
    pt: 'Bem-vindo ao nosso portal de constituição de sociedade. Preencha as informações abaixo passo a passo. Ao final, a nossa equipa terá tudo o que precisa para avançar com o processo.',
    en: 'Welcome to our company incorporation portal. Please fill in the information below step by step. Once completed, our team will have everything needed to proceed with the process.'
  },
  s1_contact: { pt: 'Contacto principal', en: 'Main contact' },
  s1_contact_ph: { pt: 'Nome de quem está a preencher este formulário', en: 'Name of the person filling in this form' },
  s1_email: { pt: 'Email', en: 'Email' },
  s1_email_ph: { pt: 'email@exemplo.com', en: 'email@example.com' },
  s1_email_error: { pt: 'Por favor insira um email válido', en: 'Please enter a valid email' },
  s1_phone: { pt: 'Telefone', en: 'Phone' },
  s1_names_label: { pt: 'Nomes pretendidos para a sociedade', en: 'Proposed company names' },
  s1_names_hint: {
    pt: 'Indique 3 opções de nome, preferencialmente distintos entre si. Serão submetidos ao Registo Nacional de Pessoas Coletivas para aprovação.',
    en: 'Please provide 3 name options, preferably distinct from each other. They will be submitted to the National Registry for approval.'
  },
  s1_name_1: { pt: '1ª opção de nome', en: '1st name option' },
  s1_name_2: { pt: '2ª opção de nome', en: '2nd name option' },
  s1_name_3: { pt: '3ª opção de nome', en: '3rd name option' },
  s1_activities: { pt: 'Breve descrição das atividades da sociedade', en: 'Brief description of company activities' },
  s1_activities_hint: {
    pt: 'Descreva resumidamente o objeto social pretendido. A nossa equipa irá adaptar para linguagem jurídica.',
    en: 'Briefly describe the intended business purpose. Our team will adapt it to legal language.'
  },
  s1_activities_ph: { pt: 'Descreva resumidamente o objeto social pretendido...', en: 'Briefly describe the intended business purpose...' },
  s1_notes: { pt: 'Notas adicionais', en: 'Additional notes' },
  s1_notes_ph: { pt: 'Alguma informação adicional relevante para o processo (opcional)', en: 'Any additional relevant information for the process (optional)' },

  // Navigation
  btn_next: { pt: 'Seguinte →', en: 'Next →' },
  btn_prev: { pt: '← Anterior', en: '← Previous' },
  btn_review: { pt: 'Revisar e Submeter →', en: 'Review & Submit →' },
  btn_submit: { pt: 'Submeter Formulário', en: 'Submit Form' },

  // Step 2 — Shareholders
  s2_title: { pt: 'Sócios / Acionistas', en: 'Shareholders' },
  s2_subtitle: { pt: 'Adicione todos os sócios da sociedade a constituir.', en: 'Add all shareholders of the company to be incorporated.' },
  s2_info: {
    pt: 'Para cada sócio, indique se é uma pessoa singular ou coletiva e se tem residência/sede em Portugal ou no estrangeiro. Os campos e documentos necessários serão adaptados automaticamente.',
    en: 'For each shareholder, indicate whether they are an individual or a legal entity, and whether they are based in Portugal or abroad. The required fields and documents will be adjusted automatically.'
  },
  btn_add_shareholder: { pt: '+ Adicionar outro sócio', en: '+ Add another shareholder' },
  sh_label: { pt: 'Sócio', en: 'Shareholder' },
  sh_type: { pt: 'Tipo de sócio', en: 'Type of shareholder' },
  sh_individual: { pt: 'Pessoa Singular', en: 'Individual' },
  sh_corporate: { pt: 'Pessoa Coletiva', en: 'Legal Entity' },
  sh_residence: { pt: 'Residência / Sede', en: 'Residence / Registered office' },
  sh_portugal: { pt: 'Portugal', en: 'Portugal' },
  sh_foreign: { pt: 'Estrangeiro', en: 'Foreign' },
  sh_remove: { pt: 'Remover sócio', en: 'Remove shareholder' },

  // Individual fields
  f_fullname: { pt: 'Nome completo', en: 'Full name' },
  f_fullname_ph: { pt: 'Nome completo', en: 'Full name' },
  f_nationality: { pt: 'Nacionalidade', en: 'Nationality' },
  f_nationality_ph: { pt: 'Ex: Alemã', en: 'E.g.: German' },
  f_birthplace: { pt: 'Naturalidade (cidade de nascimento)', en: 'Place of birth (city)' },
  f_birthplace_ph: { pt: 'Ex: Berlim, Alemanha', en: 'E.g.: Berlin, Germany' },
  f_dob: { pt: 'Data de nascimento', en: 'Date of birth' },
  f_civil_status: { pt: 'Estado civil', en: 'Marital status' },
  f_civil_select: { pt: 'Selecionar...', en: 'Select...' },
  f_civil_single: { pt: 'Solteiro(a)', en: 'Single' },
  f_civil_married: { pt: 'Casado(a)', en: 'Married' },
  f_civil_divorced: { pt: 'Divorciado(a)', en: 'Divorced' },
  f_civil_widowed: { pt: 'Viúvo(a)', en: 'Widowed' },
  f_civil_partner: { pt: 'União de facto', en: 'Civil partnership' },
  f_doc_number: { pt: 'Nº Passaporte / CC', en: 'Passport / ID number' },
  f_doc_number_ph: { pt: 'Nº documento', en: 'Document number' },
  f_doc_issuer: { pt: 'Entidade emissora', en: 'Issuing authority' },
  f_doc_issuer_ph: { pt: 'Ex: HMPO, IRN', en: 'E.g.: HMPO, IRN' },
  f_doc_issue: { pt: 'Data de emissão', en: 'Issue date' },
  f_doc_expiry: { pt: 'Data de validade', en: 'Expiry date' },
  f_address: { pt: 'Morada completa', en: 'Full address' },
  f_address_ph: { pt: 'Morada completa incluindo código postal e país', en: 'Full address including postal code and country' },

  // Corporate fields
  f_corp_name: { pt: 'Nome/Firma da sociedade', en: 'Company name' },
  f_corp_name_ph: { pt: 'Ex: ABC Holdings LTD', en: 'E.g.: ABC Holdings LTD' },
  f_corp_type: { pt: 'Tipo societário', en: 'Company type' },
  f_corp_type_ph: { pt: 'Ex: Limited, GmbH, SAS', en: 'E.g.: Limited, GmbH, SAS' },
  f_corp_country: { pt: 'País de constituição', en: 'Country of incorporation' },
  f_corp_country_ph: { pt: 'Ex: Alemanha', en: 'E.g.: Germany' },
  f_corp_reg: { pt: 'Nº de registo', en: 'Registration number' },
  f_corp_reg_ph: { pt: 'Nº registo comercial', en: 'Commercial registration number' },
  f_corp_address: { pt: 'Sede registada', en: 'Registered address' },
  f_corp_address_ph: { pt: 'Morada da sede', en: 'Registered office address' },
  f_corp_representative: { pt: 'Representante legal do sócio (quem assina pela sociedade estrangeira)', en: 'Legal representative of the shareholder (who signs on behalf of the foreign company)' },
  f_corp_representative_ph: { pt: 'Nome completo de quem assinará pela sociedade', en: 'Full name of the person signing on behalf of the company' },
  f_corp_rep_passport: { pt: 'Nº Passaporte do representante', en: 'Representative passport number' },
  f_corp_rep_passport_ph: { pt: 'Nº do passaporte do representante legal', en: 'Legal representative passport number' },
  f_corp_rep_nationality: { pt: 'Nacionalidade do representante', en: 'Representative nationality' },
  f_corp_rep_nationality_ph: { pt: 'Ex: Alemã', en: 'E.g.: German' },
  f_corp_rep_address: { pt: 'Morada do representante', en: 'Representative address' },
  f_corp_rep_address_ph: { pt: 'Morada completa do representante legal', en: 'Full address of legal representative' },

  // UBO section
  s2_ubo_title: { pt: 'Beneficiário Efetivo (UBO)', en: 'Ultimate Beneficial Owner (UBO)' },
  s2_ubo_info: {
    pt: 'Para efeitos do RCBE, identifique a pessoa singular que detém, direta ou indiretamente, mais de 25% do capital social da sociedade.',
    en: 'For RCBE purposes, please identify the natural person who ultimately owns or controls more than 25% of the company\'s capital.'
  },
  f_ubo_name: { pt: 'Nome completo do beneficiário efetivo', en: 'Full name of the ultimate beneficial owner' },
  f_ubo_dob: { pt: 'Data de nascimento', en: 'Date of birth' },
  f_ubo_doc_number: { pt: 'Nº documento de identificação', en: 'ID document number' },
  f_ubo_nif_pt: { pt: 'NIF português (se aplicável)', en: 'Portuguese NIF (if applicable)' },
  f_ubo_nif_foreign: { pt: 'Nº identificação fiscal estrangeiro', en: 'Foreign tax ID number' },
  f_ubo_nationality: { pt: 'Nacionalidade', en: 'Nationality' },
  f_ubo_birthplace: { pt: 'Naturalidade', en: 'Place of birth' },
  f_ubo_address: { pt: 'Morada completa de residência', en: 'Full residential address' },
  f_ubo_upload: { pt: 'Upload do documento de identificação do beneficiário', en: 'Upload beneficial owner\'s ID document' },
  f_ubo_upload_hint: { pt: 'Passaporte ou documento de identificação — os dados serão preenchidos automaticamente', en: 'Passport or ID document — data will be filled in automatically' },

  // NIF section
  f_has_nif: { pt: 'Tem NIF/NIPC português?', en: 'Do you have a Portuguese tax number (NIF/NIPC)?' },
  f_has_nif_corp: { pt: 'A empresa tem NIPC português?', en: 'Does the company have a Portuguese NIPC (tax number)?' },
  f_corp_rep_upload: { pt: 'Upload do passaporte do representante legal', en: 'Upload legal representative\'s passport' },
  f_corp_rep_upload_hint: { pt: 'Passaporte ou documento de identificação — os dados serão preenchidos automaticamente', en: 'Passport or ID document — data will be filled in automatically' },
  f_yes: { pt: 'Sim', en: 'Yes' },
  f_no: { pt: 'Não', en: 'No' },
  f_nif: { pt: 'NIF/NIPC', en: 'NIF/NIPC (Tax number)' },
  f_nif_ph: { pt: 'Número de contribuinte português', en: 'Portuguese tax identification number' },
  nif_warning: {
    pt: 'Será necessário solicitar o NIF/NIPC antes da constituição. Este serviço tem um custo de <strong>€250</strong>. Os documentos necessários serão preparados pela nossa equipa.',
    en: 'A NIF/NIPC will need to be requested before incorporation. This service has a cost of <strong>€250</strong>. The necessary documents will be prepared by our team.'
  },
  rep_fiscal_info_manager: {
    pt: 'A representação fiscal é obrigatória para gerentes não residentes em Portugal. Este serviço tem um custo anual de <strong>€500</strong>.',
    en: 'Fiscal representation is mandatory for directors/managers not resident in Portugal. This service has an annual cost of <strong>€500</strong>.'
  },
  f_rep_fiscal: { pt: 'Representante fiscal', en: 'Fiscal representative' },
  f_rep_oncorporate: { pt: 'OnCorporate (padrão)', en: 'OnCorporate (default)' },
  f_rep_other: { pt: 'Outro', en: 'Other' },
  f_rep_name: { pt: 'Nome do representante fiscal', en: 'Fiscal representative name' },
  f_rep_nif: { pt: 'NIF do representante fiscal', en: 'Fiscal representative NIF' },
  f_rep_address: { pt: 'Morada do representante fiscal', en: 'Fiscal representative address' },
  f_rep_address_ph: { pt: 'Morada completa em Portugal', en: 'Full address in Portugal' },

  // Step 3 — Managers
  s3_representation_title: { pt: 'Como será representada a sociedade?', en: 'How should the company be represented?' },
  s3_representation_hint: { pt: 'Selecione quantos diretores são necessários para assinar em nome da sociedade.', en: 'Select how many directors are required to sign on behalf of the company.' },
  s3_rep_one: { pt: 'Assinatura de 1 diretor (qualquer um)', en: 'Signature of 1 director (any one)' },
  s3_rep_two: { pt: 'Assinatura de 2 diretores em conjunto', en: 'Signature of 2 directors jointly' },
  s3_rep_three: { pt: 'Assinatura de 3 diretores em conjunto', en: 'Signature of 3 directors jointly' },
  s3_rep_all: { pt: 'Assinatura de todos os diretores em conjunto', en: 'Signature of all directors jointly' },
  s3_title: { pt: 'Gerentes', en: 'Directors / Managers' },
  s3_subtitle: { pt: 'Indique quem será nomeado gerente da sociedade.', en: 'Indicate who will be appointed as director of the company.' },
  s3_info: {
    pt: 'O(s) gerente(s) representam e administram a sociedade. Caso o gerente não tenha NIF português, será necessário obtê-lo antes da constituição.',
    en: 'The director(s) represent and manage the company. If the director does not have a Portuguese NIF, it will need to be obtained before incorporation.'
  },
  btn_add_manager: { pt: '+ Adicionar outro gerente', en: '+ Add another director' },
  mg_label: { pt: 'Gerente', en: 'Director' },
  mg_remove: { pt: 'Remover gerente', en: 'Remove director' },
  mg_resident: { pt: 'Residente em Portugal?', en: 'Resident in Portugal?' },
  mg_has_nif: { pt: 'Tem NIF português?', en: 'Do you have a Portuguese NIF?' },
  mg_nif: { pt: 'NIF', en: 'NIF (Tax number)' },
  mg_nif_warning: {
    pt: 'Será necessário solicitar o NIF antes da constituição. Este serviço tem um custo de <strong>€250</strong>. Os documentos serão preparados pela nossa equipa.',
    en: 'A NIF will need to be requested before incorporation. This service has a cost of <strong>€250</strong>. The documents will be prepared by our team.'
  },

  // Step 4 — Documents
  s4_title: { pt: 'Upload de Documentos', en: 'Document Upload' },
  s4_subtitle: { pt: 'Envie os documentos necessários para cada interveniente.', en: 'Upload the required documents for each party.' },
  s4_info: {
    pt: 'Faça upload dos documentos indicados abaixo. Aceita ficheiros PDF, JPG, PNG ou DOC. Se ainda não tiver algum documento, pode submeter o formulário e enviá-lo posteriormente.',
    en: 'Upload the documents listed below. Accepted formats: PDF, JPG, PNG or DOC. If you don\'t have a document yet, you can submit the form and send it later.'
  },
  doc_passport: { pt: 'Passaporte / Cartão de Cidadão (cópia)', en: 'Passport / ID Card (copy)' },
  doc_address_proof: { pt: 'Comprovativo de morada (últimos 3 meses)', en: 'Proof of address (last 3 months)' },
  doc_good_standing: { pt: 'Certificate of Good Standing (apostilado)', en: 'Certificate of Good Standing (apostilled)' },
  doc_poa_signed: { pt: 'Procuração assinada (se já tiver)', en: 'Signed Power of Attorney (if available)' },
  doc_certidao: { pt: 'Certidão permanente da sociedade', en: 'Company permanent certificate' },
  doc_additional: { pt: 'Documentos adicionais (opcional)', en: 'Additional documents (optional)' },
  doc_additional_desc: { pt: 'Outros documentos que considere relevantes para o processo.', en: 'Other documents you consider relevant for the process.' },
  doc_additional_1: { pt: 'Documento adicional 1', en: 'Additional document 1' },
  doc_additional_2: { pt: 'Documento adicional 2', en: 'Additional document 2' },
  doc_additional_3: { pt: 'Documento adicional 3', en: 'Additional document 3' },
  doc_upload_text: { pt: 'Clique para selecionar ficheiro (PDF, JPG, PNG, DOC)', en: 'Click to select file (PDF, JPG, PNG, DOC)' },
  doc_documents_for: { pt: 'Documentos', en: 'Documents' },

  // Step 5 — Review
  s5_title: { pt: 'Revisão Final', en: 'Final Review' },
  s5_subtitle: { pt: 'Verifique todas as informações antes de submeter.', en: 'Please verify all information before submitting.' },
  s5_success_info: {
    pt: 'Ao submeter, a nossa equipa receberá todas as informações e documentos. Será contactado(a) em breve para os próximos passos.',
    en: 'Upon submission, our team will receive all information and documents. You will be contacted shortly with the next steps.'
  },
  r_society_data: { pt: 'Dados da Sociedade', en: 'Company Details' },
  r_name_1: { pt: '1ª Opção de nome', en: '1st Name Option' },
  r_name_2: { pt: '2ª Opção de nome', en: '2nd Name Option' },
  r_name_3: { pt: '3ª Opção de nome', en: '3rd Name Option' },
  r_contact: { pt: 'Contacto', en: 'Contact' },
  r_name: { pt: 'Nome', en: 'Name' },
  r_nationality: { pt: 'Nacionalidade', en: 'Nationality' },
  r_birthplace: { pt: 'Naturalidade', en: 'Place of birth' },
  r_passport: { pt: 'Passaporte/CC', en: 'Passport/ID' },
  r_address: { pt: 'Morada', en: 'Address' },
  r_firm: { pt: 'Firma', en: 'Company' },
  r_country: { pt: 'País', en: 'Country' },
  r_reg_number: { pt: 'Nº Registo', en: 'Reg. Number' },
  r_residence: { pt: 'Residência', en: 'Residence' },
  r_portugal: { pt: 'Portugal', en: 'Portugal' },
  r_foreign: { pt: 'Estrangeiro', en: 'Foreign' },
  r_nif: { pt: 'NIF/NIPC', en: 'NIF/NIPC' },
  r_nif_pending: { pt: 'A solicitar (€250)', en: 'To be requested (€250)' },
  r_not_filled: { pt: 'Não preenchido', en: 'Not filled' },
  r_activities: { pt: 'Atividades', en: 'Activities' },
  r_corp_representative: { pt: 'Representante legal', en: 'Legal representative' },
  r_corp_rep_passport: { pt: 'Passaporte do representante', en: 'Representative passport' },
  r_corp_rep_nationality: { pt: 'Nacionalidade do representante', en: 'Representative nationality' },
  r_corp_rep_address: { pt: 'Morada do representante', en: 'Representative address' },
  r_docs_title: { pt: 'Documentos a preparar (pela nossa equipa)', en: 'Documents to be prepared (by our team)' },
  r_costs_title: { pt: 'Custos estimados dos serviços adicionais', en: 'Estimated additional service costs' },
  r_total: { pt: 'Total estimado', en: 'Estimated total' },
  r_costs_note: {
    pt: '* Valores de representação fiscal são anuais. Os valores apresentados não incluem IVA (se aplicável) nem taxas governamentais de constituição da sociedade.',
    en: '* Fiscal representation fees are annual. The amounts shown do not include VAT (if applicable) or government fees for company incorporation.'
  },

  // Generated documents list
  d_pacto: { pt: 'Pacto Social', en: 'Articles of Association' },
  d_checklist: { pt: 'Checklist de Constituição', en: 'Incorporation Checklist' },
  d_poa_incorp: { pt: 'POA para Constituição (Procuração)', en: 'Power of Attorney for Incorporation' },
  d_poa_rnpc: { pt: 'POA para RNPC (pedido de NIPC)', en: 'POA for RNPC (NIPC request)' },
  d_cert_good_standing: { pt: 'Certificação/Tradução do Good Standing', en: 'Good Standing Certificate/Translation' },
  d_poa_nif: { pt: 'Procuração para pedido de NIF/NIPC', en: 'Power of Attorney for NIF/NIPC request' },
  d_rep_fiscal: { pt: 'Nomeação de representante fiscal', en: 'Fiscal representative appointment' },
  d_carta_rep: { pt: 'Carta de aceitação representação fiscal', en: 'Fiscal representation acceptance letter' },
  d_carta_gerente: { pt: 'Carta de aceitação do gerente', en: 'Director acceptance letter' },
  d_poa_nif_short: { pt: 'Procuração para pedido de NIF', en: 'Power of Attorney for NIF request' },

  // Cost descriptions
  c_nif_request: { pt: 'Pedido de NIF', en: 'NIF request' },
  c_nipc_request: { pt: 'Pedido de NIPC', en: 'NIPC request' },
  c_rep_fiscal: { pt: 'Representação fiscal', en: 'Fiscal representation' },

  // Badges
  b_new: { pt: 'Novo', en: 'New' },
  b_ind_pt: { pt: 'Pessoa Singular PT', en: 'Individual PT' },
  b_ind_foreign: { pt: 'Pessoa Singular Estrangeira', en: 'Foreign Individual' },
  b_corp_pt: { pt: 'Pessoa Coletiva PT', en: 'Legal Entity PT' },
  b_corp_foreign: { pt: 'Pessoa Coletiva Estrangeira', en: 'Foreign Legal Entity' },

  // Overlays
  loading_title: { pt: 'A enviar...', en: 'Submitting...' },
  loading_text: { pt: 'Por favor aguarde enquanto processamos os seus dados e documentos.', en: 'Please wait while we process your data and documents.' },
  success_title: { pt: 'Formulário Submetido com Sucesso!', en: 'Form Successfully Submitted!' },
  success_text: {
    pt: 'A nossa equipa recebeu todas as informações. Será contactado(a) em breve com os próximos passos do processo de constituição.',
    en: 'Our team has received all the information. You will be contacted shortly with the next steps of the incorporation process.'
  },
  success_close: { pt: 'Pode fechar esta página.', en: 'You may close this page.' },

  // Validation
  v_add_shareholder: { pt: 'Adicione pelo menos um sócio.', en: 'Please add at least one shareholder.' },
  v_add_manager: { pt: 'Adicione pelo menos um gerente.', en: 'Please add at least one director.' },
  v_submit_error: {
    pt: 'Ocorreu um erro ao enviar. Por favor tente novamente ou contacte-nos diretamente.',
    en: 'An error occurred while submitting. Please try again or contact us directly.'
  },

  // Pluralisation helpers
  file_singular: { pt: 'ficheiro', en: 'file' },
  file_plural: { pt: 'ficheiros', en: 'files' },
  per_year: { pt: '/ano', en: '/year' },
  document_fallback: { pt: 'Documento', en: 'Document' },
  invalid_server_response: { pt: 'Resposta inválida do servidor', en: 'Invalid server response' },
  server_error: { pt: 'Erro do servidor', en: 'Server error' },

  // Language toggle
  lang_pt: { pt: 'PT', en: 'PT' },
  lang_en: { pt: 'EN', en: 'EN' },

  // Step 0 — Flow Choice
  flow_title: { pt: 'Como prefere começar?', en: 'How would you like to start?' },
  flow_subtitle: { pt: 'Escolha a opção que melhor se adequa a si.', en: 'Choose the option that best suits you.' },
  flow_manual_title: { pt: 'Preenchimento Manual', en: 'Fill in Manually' },
  flow_manual_desc: {
    pt: 'Preencha os dados passo a passo. Ideal se ainda não tem os documentos digitalizados.',
    en: 'Fill in the data step by step. Ideal if you don\'t have the documents scanned yet.'
  },
  flow_smart_title: { pt: 'Smart Upload', en: 'Smart Upload' },
  flow_smart_desc: {
    pt: 'Envie os documentos (passaporte, Good Standing, etc.) e os dados são extraídos automaticamente. Mais rápido e fácil.',
    en: 'Upload your documents (passport, Good Standing, etc.) and the data is extracted automatically. Faster and easier.'
  },
  flow_smart_badge: { pt: 'Recomendado', en: 'Recommended' },

  // Smart Upload page
  su_title: { pt: 'Smart Upload — Envio de Documentos', en: 'Smart Upload — Document Upload' },
  su_subtitle: {
    pt: 'Envie os documentos e extraímos os dados automaticamente.',
    en: 'Upload your documents and we\'ll extract the data automatically.'
  },
  su_drop_text: {
    pt: 'Arraste ficheiros para aqui ou clique para selecionar',
    en: 'Drag files here or click to select'
  },
  su_drop_hint: {
    pt: 'Passaporte, Good Standing, comprovativo de morada — PDF, JPG ou PNG',
    en: 'Passport, Good Standing, proof of address — PDF, JPG or PNG'
  },
  su_status_uploading: { pt: 'A enviar...', en: 'Uploading...' },
  su_status_extracting: { pt: 'A extrair dados...', en: 'Extracting data...' },
  su_status_done: { pt: 'Concluído', en: 'Done' },
  su_status_error: { pt: 'Erro na extração', en: 'Extraction error' },
  su_no_files: { pt: 'Nenhum ficheiro enviado ainda.', en: 'No files uploaded yet.' },
  su_continue: { pt: 'Continuar para o formulário →', en: 'Continue to form →' },
  su_add_more: { pt: '+ Adicionar mais documentos', en: '+ Add more documents' },
  su_preview_title: { pt: 'Dados extraídos', en: 'Extracted data' },
  su_preview_info: {
    pt: 'Os dados abaixo foram extraídos automaticamente. No próximo passo poderá rever e corrigir tudo.',
    en: 'The data below was extracted automatically. In the next step you can review and correct everything.'
  },
  su_confidence_high: { pt: 'Alta', en: 'High' },
  su_confidence_medium: { pt: 'Média', en: 'Medium' },
  su_confidence_low: { pt: 'Baixa', en: 'Low' },
  su_doc_type_passport: { pt: 'Passaporte', en: 'Passport' },
  su_doc_type_id_card: { pt: 'Cartão de Cidadão', en: 'ID Card' },
  su_doc_type_good_standing: { pt: 'Good Standing', en: 'Good Standing' },
  su_doc_type_proof_of_address: { pt: 'Comprovativo de morada', en: 'Proof of address' },
  su_doc_type_other: { pt: 'Outro documento', en: 'Other document' },
  su_extraction_overlay: { pt: 'A processar documento...', en: 'Processing document...' },
  su_prefill_info: {
    pt: 'Os campos destacados em azul foram preenchidos automaticamente a partir dos seus documentos. Por favor reveja e corrija se necessário.',
    en: 'Fields highlighted in blue were automatically filled from your documents. Please review and correct if needed.'
  },
  su_already_uploaded: { pt: 'Já enviado via Smart Upload', en: 'Already uploaded via Smart Upload' },
  su_back_to_choice: { pt: '← Voltar à escolha', en: '← Back to choice' },

  // Smart Upload — Party builder
  su_parties_info: {
    pt: 'Primeiro, diga-nos quem são os intervenientes. Mostraremos exatamente quais documentos são necessários para cada um.',
    en: 'First, tell us who the parties are. We\'ll then show you exactly which documents are needed for each one.'
  },
  su_add_party: { pt: '+ Adicionar pessoa / empresa', en: '+ Add a person / company' },
  su_party_name_ph: { pt: 'Nome da pessoa ou empresa', en: 'Person or company name' },
  su_party_role: { pt: 'Papel', en: 'Role' },
  su_party_role_sh: { pt: 'Sócio', en: 'Shareholder' },
  su_party_role_mg: { pt: 'Gerente', en: 'Director' },
  su_party_role_both: { pt: 'Ambos', en: 'Both' },
  su_party_type: { pt: 'Tipo', en: 'Type' },
  su_party_type_ind: { pt: 'Pessoa singular', en: 'Individual' },
  su_party_type_corp: { pt: 'Empresa', en: 'Company' },
  su_docs_for: { pt: 'Documentos para', en: 'Documents for' },
  su_cat_passport: { pt: 'Passaporte / Cartão de Cidadão (cópia)', en: 'Passport / ID Card (copy)' },
  su_cat_proof_address: { pt: 'Comprovativo de morada (últimos 3 meses)', en: 'Proof of address (last 3 months)' },
  su_cat_good_standing: { pt: 'Certificate of Good Standing (apostilado)', en: 'Certificate of Good Standing (apostilled)' },
  su_cat_poa: { pt: 'Procuração (se aplicável)', en: 'Power of Attorney (if applicable)' },
  su_cat_other: { pt: 'Outros documentos', en: 'Other documents' },
  su_cat_general: { pt: 'Documentos Gerais', en: 'General Documents' },
  su_upload_here: { pt: 'Arraste o ficheiro aqui ou clique para selecionar', en: 'Drag file here or click to select' },
  su_optional: { pt: '(opcional)', en: '(optional)' },
  su_required: { pt: '(obrigatório)', en: '(required)' },

  // Document upload in entity cards
  sh_upload_id: { pt: 'Upload de documento de identificação', en: 'Upload identification document' },
  sh_upload_id_hint: { pt: 'Passaporte ou Cartão de Cidadão — os dados serão preenchidos automaticamente', en: 'Passport or Citizen Card — data will be filled in automatically' },
  sh_upload_corp_doc: { pt: 'Upload de documento da sociedade', en: 'Upload company document' },
  sh_upload_corp_hint: { pt: 'Certificate of Good Standing, certidão permanente ou outro documento com os dados da sociedade', en: 'Certificate of Good Standing, permanent certificate or other document with company details' },
  mg_upload_id: { pt: 'Upload de documento de identificação', en: 'Upload identification document' },
  mg_upload_id_hint: { pt: 'Passaporte ou Cartão de Cidadão — os dados serão preenchidos automaticamente', en: 'Passport or Citizen Card — data will be filled in automatically' },
  mg_upload_address: { pt: 'Comprovativo de morada', en: 'Proof of address' },
  mg_upload_address_hint: {
    pt: 'Documento com data inferior a 3 meses (ex: conta de água, luz, gás, extrato bancário). Não são aceites contas de telemóvel.',
    en: 'Document dated within the last 3 months (e.g.: water, electricity, gas bill, bank statement). Mobile phone bills are not accepted.'
  },
  upload_or_fill: { pt: 'Os dados serão extraídos automaticamente. Poderá rever e corrigir abaixo.', en: 'Data will be extracted automatically. You can review and correct below.' },
  upload_extracting: { pt: 'A extrair dados...', en: 'Extracting data...' },
  upload_extracted: { pt: 'Dados extraídos — verifique abaixo', en: 'Data extracted — please verify below' },
  upload_failed: { pt: 'Não foi possível extrair — preencha manualmente', en: 'Could not extract — please fill in manually' },
  upload_no_data: {
    pt: 'Documento recebido. Por favor preencha os campos principais abaixo — a nossa equipa verificará com base no documento.',
    en: 'Document received. Please fill in the main fields below — our team will verify against the document.'
  },
  upload_drop_text: { pt: 'Arraste o documento aqui ou clique para selecionar', en: 'Drag document here or click to select' },

  // Incorporation fee
  c_incorporation_fee: { pt: 'Honorários de constituição', en: 'Incorporation fee' },
  r_invoice_note: {
    pt: 'A nossa fatura será enviada por email após a submissão.',
    en: 'Our invoice will be sent by email after submission.'
  },

  // Step 4 simplified
  s4_title_simple: { pt: 'Documentos Adicionais', en: 'Additional Documents' },
  s4_subtitle_simple: { pt: 'Se tiver documentos adicionais que considere relevantes, pode enviá-los aqui.', en: 'If you have any additional documents you consider relevant, you can upload them here.' },
  s4_info_simple: {
    pt: 'Este passo é opcional. Os documentos de identificação já foram associados nos passos anteriores.',
    en: 'This step is optional. Identification documents have already been associated in the previous steps.'
  },
};

function t(key) {
  const entry = translations[key];
  if (!entry) return key;
  return entry[currentLang] || entry['en'] || key;
}

function setLanguage(lang) {
  currentLang = lang;
  localStorage.setItem('portal_lang', lang);

  // Update toggle buttons
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.lang === lang);
  });

  // Update static HTML elements with data-i18n attribute
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.innerHTML = val;
    }
  });

  // Update data-i18n-placeholder
  document.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });

  // Update page title
  document.title = t('page_title');

  // Update html lang attribute
  document.documentElement.lang = lang === 'pt' ? 'pt' : 'en';

  // Rebuild dynamic sections if they exist
  if (typeof rebuildDynamicCards === 'function') {
    rebuildDynamicCards();
  }
}

// Init language from localStorage or browser
function initLanguage() {
  const saved = localStorage.getItem('portal_lang');
  if (saved) {
    currentLang = saved;
  } else {
    const browserLang = navigator.language.substring(0, 2);
    currentLang = browserLang === 'pt' ? 'pt' : 'en';
  }
}

// ==========================================
// Portal de Constituição de Sociedades
// ==========================================

const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzGkmjSZCgsXEVcm618ZTiC5j0gtwYg0yX7B5vEYEBMcBIXKSAllazGeGC-mt8mxKS8/exec';

// ========== STATE ==========
let currentStep = 0; // Start at Step 0 (flow choice)
const totalSteps = 5;
let shareholderCounter = 0;
let managerCounter = 0;
let flowMode = null; // 'manual' or 'smart'
let extractedData = []; // Array of extraction results from Smart Upload
let pendingFileIds = []; // Drive file IDs from Smart Upload
let smartUploadFiles = {}; // Track files uploaded via Smart Upload {name: true}

// ========== INIT ==========
document.addEventListener('DOMContentLoaded', () => {
  initLanguage();
  setLanguage(currentLang);
  hideProgressBar();
  initSmartUpload();
});

// ========== FLOW CHOICE ==========
function chooseFlow(mode) {
  flowMode = mode;
  document.getElementById('step-0').classList.remove('active');

  if (mode === 'manual') {
    currentStep = 1;
    document.getElementById('step-1').classList.add('active');
    showProgressBar();
    updateProgress();
    addShareholder();
    addManager();
  } else {
    document.getElementById('step-smart-upload').classList.add('active');
  }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToFlowChoice() {
  document.getElementById('step-smart-upload').classList.remove('active');
  document.getElementById('step-0').classList.add('active');
  flowMode = null;
  // Reset Smart Upload state
  suPartyCounter = 0;
  suParties = [];
  extractedData = [];
  pendingFileIds = [];
  smartUploadFiles = {};
  document.getElementById('su-parties-list').innerHTML = '';
  document.getElementById('su-upload-categories').innerHTML = '';
  document.getElementById('extraction-preview').style.display = 'none';
  document.getElementById('su-continue-btn').disabled = true;
  hideProgressBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function backToFlowChoiceFromForm() {
  // Reset form state
  document.querySelector(`#step-${currentStep}`).classList.remove('active');
  currentStep = 0;
  document.getElementById('step-0').classList.add('active');
  flowMode = null;
  shareholderCounter = 0;
  managerCounter = 0;
  document.getElementById('shareholders-container').innerHTML = '';
  document.getElementById('managers-container').innerHTML = '';
  // Reset Smart Upload state
  suPartyCounter = 0;
  suParties = [];
  extractedData = [];
  pendingFileIds = [];
  smartUploadFiles = {};
  hideProgressBar();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function hideProgressBar() {
  document.querySelector('.progress-container').style.display = 'none';
}

function showProgressBar() {
  document.querySelector('.progress-container').style.display = '';
}

// ========== NAVIGATION ==========
function nextStep() {
  if (!validateStep(currentStep)) return;
  if (currentStep < totalSteps) {
    if (currentStep === 3) initStaticFileUploads();
    if (currentStep === 4) buildReview();
    document.querySelector(`#step-${currentStep}`).classList.remove('active');
    currentStep++;
    document.querySelector(`#step-${currentStep}`).classList.add('active');
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function prevStep() {
  if (currentStep > 1) {
    document.querySelector(`#step-${currentStep}`).classList.remove('active');
    currentStep--;
    document.querySelector(`#step-${currentStep}`).classList.add('active');
    updateProgress();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function updateProgress() {
  if (currentStep === 0) return; // No progress bar on Step 0
  for (let i = 1; i <= totalSteps; i++) {
    const circle = document.querySelector(`.step-circle[data-step="${i}"]`);
    const line = document.querySelector(`.step-line[data-after="${i}"]`);
    circle.classList.remove('active', 'completed');
    if (line) line.classList.remove('active', 'completed');
    if (i < currentStep) {
      circle.classList.add('completed');
      circle.innerHTML = '✓';
      if (line) line.classList.add('completed');
    } else if (i === currentStep) {
      circle.classList.add('active');
      circle.innerHTML = i;
      if (line) line.classList.add('active');
    } else {
      circle.innerHTML = i;
    }
  }
}

// ========== VALIDATION ==========
function validateStep(step) {
  if (step === 0) return true;
  let valid = true;
  const section = document.querySelector(`#step-${step}`);

  // Clear previous errors
  section.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
  section.querySelectorAll('.error-msg').forEach(el => el.style.display = 'none');

  // Validate text/select/date required fields (skip hidden conditional sections)
  section.querySelectorAll('input[required], select[required], textarea[required]').forEach(input => {
    // Skip fields inside hidden conditional sections
    const hiddenParent = input.closest('.conditional:not(.visible)');
    if (hiddenParent) return;

    // Skip radio buttons — validated separately below
    if (input.type === 'radio') return;

    if (!input.value.trim()) {
      input.classList.add('error');
      const errorEl = input.parentElement.querySelector('.error-msg');
      if (errorEl) errorEl.style.display = 'block';
      valid = false;
    }
  });

  // Validate required radio groups (check that at least one is selected)
  const checkedRadioNames = new Set();
  section.querySelectorAll('input[type="radio"][required]').forEach(radio => {
    const hiddenParent = radio.closest('.conditional:not(.visible)');
    if (hiddenParent) return;
    const name = radio.name;
    if (checkedRadioNames.has(name)) return;
    checkedRadioNames.add(name);
    const selected = section.querySelector(`input[name="${name}"]:checked`);
    if (!selected) {
      // Highlight the radio group
      const group = radio.closest('.radio-group');
      if (group) group.classList.add('error');
      valid = false;
    }
  });

  if (step === 2) {
    const cards = section.querySelectorAll('.entity-card');
    if (cards.length === 0) { alert(t('v_add_shareholder')); valid = false; }
  }
  if (step === 3) {
    const cards = section.querySelectorAll('.entity-card');
    if (cards.length === 0) { alert(t('v_add_manager')); valid = false; }
  }

  if (!valid) {
    const firstError = section.querySelector('.error');
    if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  return valid;
}

// ========== SHAREHOLDERS ==========
function addShareholder() {
  shareholderCounter++;
  const id = shareholderCounter;
  const container = document.getElementById('shareholders-container');

  const card = document.createElement('div');
  card.className = 'entity-card';
  card.id = `shareholder-${id}`;
  card.innerHTML = buildShareholderHTML(id);
  container.appendChild(card);
  updateBadge(id);
  initInlineUpload('sh', id);
}

function buildShareholderHTML(id) {
  return `
    <button type="button" class="remove-entity" onclick="removeShareholder(${id})" title="${t('sh_remove')}">&times;</button>
    <h3>${t('sh_label')} ${id} <span class="badge" id="sh-badge-${id}">${t('b_new')}</span></h3>

    <div class="form-group">
      <label>${t('sh_type')} <span class="required">*</span></label>
      <div class="radio-group">
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="sh_type_${id}" value="individual" required onchange="onShareholderTypeChange(${id})">
          ${t('sh_individual')}
        </label>
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="sh_type_${id}" value="corporate" onchange="onShareholderTypeChange(${id})">
          ${t('sh_corporate')}
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>${t('sh_residence')} <span class="required">*</span></label>
      <div class="radio-group">
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="sh_residence_${id}" value="portugal" required onchange="onShareholderResidenceChange(${id})">
          ${t('sh_portugal')}
        </label>
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="sh_residence_${id}" value="foreign" onchange="onShareholderResidenceChange(${id})">
          ${t('sh_foreign')}
        </label>
      </div>
    </div>

    <!-- Individual fields -->
    <div id="sh-individual-${id}" class="conditional">
      ${buildInlineUpload('sh', id, 'passport')}
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_fullname')} <span class="required">*</span></label>
          <input type="text" name="sh_name_${id}" placeholder="${t('f_fullname_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_nationality')} <span class="required">*</span></label>
          <input type="text" name="sh_nationality_${id}" placeholder="${t('f_nationality_ph')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_birthplace')} <span class="required">*</span></label>
          <input type="text" name="sh_birthplace_${id}" placeholder="${t('f_birthplace_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_dob')}</label>
          <input type="date" name="sh_dob_${id}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_civil_status')} <span class="required">*</span></label>
          <select name="sh_civil_status_${id}">
            <option value="">${t('f_civil_select')}</option>
            <option value="solteiro">${t('f_civil_single')}</option>
            <option value="casado">${t('f_civil_married')}</option>
            <option value="divorciado">${t('f_civil_divorced')}</option>
            <option value="viuvo">${t('f_civil_widowed')}</option>
            <option value="uniao_facto">${t('f_civil_partner')}</option>
          </select>
        </div>
        <div class="form-group"></div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_doc_number')} <span class="required">*</span></label>
          <input type="text" name="sh_doc_number_${id}" placeholder="${t('f_doc_number_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_doc_issuer')} <span class="required">*</span></label>
          <input type="text" name="sh_doc_issuer_${id}" placeholder="${t('f_doc_issuer_ph')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_doc_issue')} <span class="required">*</span></label>
          <input type="date" name="sh_doc_issue_${id}">
        </div>
        <div class="form-group">
          <label>${t('f_doc_expiry')} <span class="required">*</span></label>
          <input type="date" name="sh_doc_expiry_${id}">
        </div>
      </div>
      <div class="form-group">
        <label>${t('f_address')} <span class="required">*</span></label>
        <input type="text" name="sh_address_${id}" placeholder="${t('f_address_ph')}">
      </div>
    </div>

    <!-- Corporate fields -->
    <div id="sh-corporate-${id}" class="conditional">
      ${buildInlineUpload('sh', id, 'corporate')}
      <div class="form-group">
        <label>${t('f_corp_name')} <span class="required">*</span></label>
        <input type="text" name="sh_corp_name_${id}" placeholder="${t('f_corp_name_ph')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_corp_type')} <span class="required">*</span></label>
          <input type="text" name="sh_corp_type_${id}" placeholder="${t('f_corp_type_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_corp_country')} <span class="required">*</span></label>
          <input type="text" name="sh_corp_country_${id}" placeholder="${t('f_corp_country_ph')}">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_corp_reg')} <span class="required">*</span></label>
          <input type="text" name="sh_corp_reg_${id}" placeholder="${t('f_corp_reg_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_corp_address')} <span class="required">*</span></label>
          <input type="text" name="sh_corp_address_${id}" placeholder="${t('f_corp_address_ph')}">
        </div>
      </div>
      <hr style="margin:20px 0;border:none;border-top:1px solid #eaeaea">
      <h4 style="margin-bottom:12px;color:#6C3CE1;font-size:.9rem">${t('f_corp_representative')}</h4>
      ${buildInlineUpload('sh_rep', id, 'passport')}
      <div class="form-group">
        <label>${t('f_corp_representative')} <span class="required">*</span></label>
        <input type="text" name="sh_corp_representative_${id}" placeholder="${t('f_corp_representative_ph')}">
      </div>
      <div class="form-group">
        <label>${t('f_corp_rep_passport')}</label>
        <input type="text" name="sh_corp_representative_passport_${id}" placeholder="${t('f_corp_rep_passport_ph')}">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>${t('f_corp_rep_nationality')}</label>
          <input type="text" name="sh_corp_representative_nationality_${id}" placeholder="${t('f_corp_rep_nationality_ph')}">
        </div>
        <div class="form-group">
          <label>${t('f_corp_rep_address')}</label>
          <input type="text" name="sh_corp_representative_address_${id}" placeholder="${t('f_corp_rep_address_ph')}">
        </div>
      </div>
    </div>

    <!-- NIF section -->
    <div id="sh-nif-section-${id}" class="conditional">
      <div class="form-group">
        <label id="sh-nif-label-${id}">${t('f_has_nif')} <span class="required">*</span></label>
        <div class="radio-group">
          <label class="radio-option" onclick="selectRadio(this)">
            <input type="radio" name="sh_has_nif_${id}" value="yes" onchange="onNifChange(${id}, 'sh')">
            ${t('f_yes')}
          </label>
          <label class="radio-option" onclick="selectRadio(this)">
            <input type="radio" name="sh_has_nif_${id}" value="no" onchange="onNifChange(${id}, 'sh')">
            ${t('f_no')}
          </label>
        </div>
      </div>
      <div id="sh-nif-yes-${id}" class="conditional">
        <div class="form-group">
          <label>${t('f_nif')} <span class="required">*</span></label>
          <input type="text" name="sh_nif_${id}" placeholder="${t('f_nif_ph')}" maxlength="9">
        </div>
      </div>
      <div id="sh-nif-no-${id}" class="conditional">
        <div class="info-box warning">${t('nif_warning')}</div>
      </div>
    </div>
  `;
}

function removeShareholder(id) {
  const card = document.getElementById(`shareholder-${id}`);
  if (card) card.remove();
  renumberEntities('shareholders-container', t('sh_label'));
}

function onShareholderTypeChange(id) {
  const type = getRadioValue(`sh_type_${id}`);
  const indDiv = document.getElementById(`sh-individual-${id}`);
  const corpDiv = document.getElementById(`sh-corporate-${id}`);
  const nifSection = document.getElementById(`sh-nif-section-${id}`);

  indDiv.classList.toggle('visible', type === 'individual');
  corpDiv.classList.toggle('visible', type === 'corporate');
  nifSection.classList.add('visible');

  // Update NIF label based on type (individual vs corporate)
  const nifLabel = document.getElementById(`sh-nif-label-${id}`);
  if (nifLabel) {
    nifLabel.innerHTML = (type === 'corporate' ? t('f_has_nif_corp') : t('f_has_nif')) + ' <span class="required">*</span>';
  }

  toggleRequired(indDiv, type === 'individual');
  toggleRequired(corpDiv, type === 'corporate');

  updateBadge(id);
  // Re-init upload zone for the visible section
  initInlineUpload('sh', id);
  if (type === 'corporate') initInlineUpload('sh_rep', id);
}

function onShareholderResidenceChange(id) {
  updateBadge(id);
}

function onNifChange(id, prefix) {
  const hasNif = getRadioValue(`${prefix}_has_nif_${id}`);
  const yesDiv = document.getElementById(`${prefix}-nif-yes-${id}`);
  const noDiv = document.getElementById(`${prefix}-nif-no-${id}`);

  yesDiv.classList.toggle('visible', hasNif === 'yes');
  noDiv.classList.toggle('visible', hasNif === 'no');

  toggleRequired(yesDiv, hasNif === 'yes');

  if (prefix === 'mg') checkRepFiscalManager(id);
}


function updateBadge(id) {
  const type = getRadioValue(`sh_type_${id}`);
  const residence = getRadioValue(`sh_residence_${id}`);
  const badge = document.getElementById(`sh-badge-${id}`);
  if (!badge) return;
  let text = t('b_new');
  if (type === 'individual' && residence === 'portugal') text = t('b_ind_pt');
  else if (type === 'individual' && residence === 'foreign') text = t('b_ind_foreign');
  else if (type === 'corporate' && residence === 'portugal') text = t('b_corp_pt');
  else if (type === 'corporate' && residence === 'foreign') text = t('b_corp_foreign');
  badge.textContent = text;
}

// ========== MANAGERS ==========
function addManager() {
  managerCounter++;
  const id = managerCounter;
  const container = document.getElementById('managers-container');

  const card = document.createElement('div');
  card.className = 'entity-card';
  card.id = `manager-${id}`;
  card.innerHTML = buildManagerHTML(id);
  container.appendChild(card);
  initInlineUpload('mg', id);
  updateRepresentationSection();
}

function buildManagerHTML(id) {
  return `
    <button type="button" class="remove-entity" onclick="removeManager(${id})" title="${t('mg_remove')}">&times;</button>
    <h3>${t('mg_label')} ${id}</h3>

    ${buildInlineUpload('mg', id, 'passport')}
    ${buildInlineUpload('mg', id, 'proof_of_address')}

    <div class="form-row">
      <div class="form-group">
        <label>${t('f_fullname')} <span class="required">*</span></label>
        <input type="text" name="mg_name_${id}" required placeholder="${t('f_fullname_ph')}">
      </div>
      <div class="form-group">
        <label>${t('f_nationality')} <span class="required">*</span></label>
        <input type="text" name="mg_nationality_${id}" required placeholder="${t('f_nationality_ph')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${t('f_birthplace')} <span class="required">*</span></label>
        <input type="text" name="mg_birthplace_${id}" required placeholder="${t('f_birthplace_ph')}">
      </div>
      <div class="form-group">
        <label>${t('f_dob')}</label>
        <input type="date" name="mg_dob_${id}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${t('f_civil_status')} <span class="required">*</span></label>
        <select name="mg_civil_status_${id}" required>
          <option value="">${t('f_civil_select')}</option>
          <option value="solteiro">${t('f_civil_single')}</option>
          <option value="casado">${t('f_civil_married')}</option>
          <option value="divorciado">${t('f_civil_divorced')}</option>
          <option value="viuvo">${t('f_civil_widowed')}</option>
          <option value="uniao_facto">${t('f_civil_partner')}</option>
        </select>
      </div>
      <div class="form-group"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${t('f_doc_number')} <span class="required">*</span></label>
        <input type="text" name="mg_doc_number_${id}" required placeholder="${t('f_doc_number_ph')}">
      </div>
      <div class="form-group">
        <label>${t('f_doc_issuer')} <span class="required">*</span></label>
        <input type="text" name="mg_doc_issuer_${id}" required placeholder="${t('f_doc_issuer_ph')}">
      </div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>${t('f_doc_issue')} <span class="required">*</span></label>
        <input type="date" name="mg_doc_issue_${id}" required>
      </div>
      <div class="form-group">
        <label>${t('f_doc_expiry')} <span class="required">*</span></label>
        <input type="date" name="mg_doc_expiry_${id}" required>
      </div>
    </div>
    <div class="form-group">
      <label>${t('f_address')} <span class="required">*</span></label>
      <input type="text" name="mg_address_${id}" required placeholder="${t('f_address_ph')}">
    </div>

    <div class="form-group">
      <label>${t('mg_resident')} <span class="required">*</span></label>
      <div class="radio-group">
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="mg_residence_${id}" value="portugal" required onchange="onManagerResidenceChange(${id})">
          ${t('f_yes')}
        </label>
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="mg_residence_${id}" value="foreign" onchange="onManagerResidenceChange(${id})">
          ${t('f_no')}
        </label>
      </div>
    </div>

    <div class="form-group">
      <label>${t('mg_has_nif')} <span class="required">*</span></label>
      <div class="radio-group">
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="mg_has_nif_${id}" value="yes" required onchange="onNifChange(${id}, 'mg')">
          ${t('f_yes')}
        </label>
        <label class="radio-option" onclick="selectRadio(this)">
          <input type="radio" name="mg_has_nif_${id}" value="no" onchange="onNifChange(${id}, 'mg')">
          ${t('f_no')}
        </label>
      </div>
    </div>
    <div id="mg-nif-yes-${id}" class="conditional">
      <div class="form-group">
        <label>${t('mg_nif')} <span class="required">*</span></label>
        <input type="text" name="mg_nif_${id}" placeholder="${t('f_nif_ph')}" maxlength="9">
      </div>
    </div>
    <div id="mg-nif-no-${id}" class="conditional">
      <div class="info-box warning">${t('mg_nif_warning')}</div>
      <div id="mg-rep-fiscal-${id}" class="conditional">
        <div class="info-box">${t('rep_fiscal_info_manager')}</div>
        <div class="form-group">
          <label>${t('f_rep_fiscal')}</label>
          <div class="radio-group">
            <label class="radio-option" onclick="selectRadio(this)">
              <input type="radio" name="mg_rep_fiscal_${id}" value="oncorporate" checked onchange="onRepFiscalManagerChange(${id})">
              ${t('f_rep_oncorporate')}
            </label>
            <label class="radio-option" onclick="selectRadio(this)">
              <input type="radio" name="mg_rep_fiscal_${id}" value="other" onchange="onRepFiscalManagerChange(${id})">
              ${t('f_rep_other')}
            </label>
          </div>
        </div>
        <div id="mg-rep-fiscal-other-${id}" class="conditional">
          <div class="form-group">
            <label>${t('f_rep_name')}</label>
            <input type="text" name="mg_rep_fiscal_name_${id}" placeholder="${t('f_fullname_ph')}">
          </div>
          <div class="form-group">
            <label>${t('f_rep_nif')}</label>
            <input type="text" name="mg_rep_fiscal_nif_${id}" placeholder="NIF" maxlength="9">
          </div>
          <div class="form-group">
            <label>${t('f_rep_address')}</label>
            <input type="text" name="mg_rep_fiscal_address_${id}" placeholder="${t('f_rep_address_ph')}">
          </div>
        </div>
      </div>
    </div>
  `;
}

function removeManager(id) {
  const card = document.getElementById(`manager-${id}`);
  if (card) card.remove();
  renumberEntities('managers-container', t('mg_label'));
  updateRepresentationSection();
}

function updateRepresentationSection() {
  const section = document.getElementById('representation-section');
  const select = document.getElementById('company-representation-select');
  const count = document.querySelectorAll('#managers-container .entity-card').length;

  if (count < 2) {
    section.style.display = 'none';
    select.innerHTML = '';
    return;
  }

  section.style.display = 'block';
  var options = `<option value="one">${t('s3_rep_one')}</option>`;
  if (count >= 2) options += `<option value="two_joint">${t('s3_rep_two')}</option>`;
  if (count >= 3) {
    options += `<option value="three_joint">${t('s3_rep_three')}</option>`;
    options += `<option value="all">${t('s3_rep_all')}</option>`;
  } else if (count === 2) {
    options += `<option value="all">${t('s3_rep_all')}</option>`;
  }
  select.innerHTML = options;
}

function onManagerResidenceChange(id) {
  checkRepFiscalManager(id);
}

function checkRepFiscalManager(id) {
  const hasNif = getRadioValue(`mg_has_nif_${id}`);
  const residence = getRadioValue(`mg_residence_${id}`);
  const repDiv = document.getElementById(`mg-rep-fiscal-${id}`);
  if (repDiv) {
    repDiv.classList.toggle('visible', hasNif === 'no' && residence === 'foreign');
  }
}

function onRepFiscalManagerChange(id) {
  const val = getRadioValue(`mg_rep_fiscal_${id}`);
  const otherDiv = document.getElementById(`mg-rep-fiscal-other-${id}`);
  if (otherDiv) otherDiv.classList.toggle('visible', val === 'other');
}

// ========== FILE UPLOADS (Step 4 — simplified) ==========
function initStaticFileUploads() {
  const container = document.getElementById('uploads-container');
  container.querySelectorAll('.file-upload').forEach(el => {
    if (el.dataset.initialized) return;
    el.dataset.initialized = 'true';
    const input = el.querySelector('input[type="file"]');
    el.addEventListener('click', (e) => {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name;
      const nameEl = el.querySelector('.file-name');
      if (fileName) {
        nameEl.textContent = fileName;
        el.classList.add('has-file');
      } else {
        nameEl.textContent = '';
        el.classList.remove('has-file');
      }
    });
  });
}

// Legacy function kept for reference
function buildUploadSection() {
  const container = document.getElementById('uploads-container');
  container.innerHTML = '';

  // Shareholders uploads
  document.querySelectorAll('#shareholders-container .entity-card').forEach((card, idx) => {
    const id = card.id.replace('shareholder-', '');
    const type = getRadioValue(`sh_type_${id}`);
    const residence = getRadioValue(`sh_residence_${id}`);
    const name = type === 'individual'
      ? (card.querySelector(`[name="sh_name_${id}"]`)?.value || `${t('sh_label')} ${idx + 1}`)
      : (card.querySelector(`[name="sh_corp_name_${id}"]`)?.value || `${t('sh_label')} ${idx + 1}`);

    let uploadsHtml = `<div class="entity-card"><h3>${t('doc_documents_for')} — ${escapeHtml(name)}</h3>`;

    if (type === 'individual') {
      uploadsHtml += fileUploadField(`sh_passport_${id}`, t('doc_passport'), true);
      uploadsHtml += fileUploadField(`sh_address_proof_${id}`, t('doc_address_proof'), true);
    } else if (type === 'corporate' && residence === 'foreign') {
      uploadsHtml += fileUploadField(`sh_good_standing_${id}`, t('doc_good_standing'), true);
      uploadsHtml += fileUploadField(`sh_poa_signed_${id}`, t('doc_poa_signed'), false);
    } else if (type === 'corporate' && residence === 'portugal') {
      uploadsHtml += fileUploadField(`sh_certidao_${id}`, t('doc_certidao'), true);
    }

    uploadsHtml += '</div>';
    container.innerHTML += uploadsHtml;
  });

  // Managers uploads
  document.querySelectorAll('#managers-container .entity-card').forEach((card, idx) => {
    const id = card.id.replace('manager-', '');
    const name = card.querySelector(`[name="mg_name_${id}"]`)?.value || `${t('mg_label')} ${idx + 1}`;

    let uploadsHtml = `<div class="entity-card"><h3>${t('doc_documents_for')} — ${escapeHtml(name)} (${t('mg_label')})</h3>`;
    uploadsHtml += fileUploadField(`mg_passport_${id}`, t('doc_passport'), true);
    uploadsHtml += fileUploadField(`mg_address_proof_${id}`, t('doc_address_proof'), true);
    uploadsHtml += '</div>';
    container.innerHTML += uploadsHtml;
  });

  // Show Smart Upload badge if applicable
  if (flowMode === 'smart' && Object.keys(smartUploadFiles).length > 0) {
    container.innerHTML = `
      <div class="info-box success" style="margin-bottom:20px">
        ✓ ${t('su_already_uploaded')} (${Object.keys(smartUploadFiles).length} ${Object.keys(smartUploadFiles).length === 1 ? t('file_singular') : t('file_plural')})
      </div>
    ` + container.innerHTML;
  }

  // Additional documents
  container.innerHTML += `
    <div class="entity-card">
      <h3>${t('doc_additional')}</h3>
      <p style="font-size:.85rem;color:#666;margin-bottom:16px">${t('doc_additional_desc')}</p>
      ${fileUploadField('additional_doc_1', t('doc_additional_1'), false)}
      ${fileUploadField('additional_doc_2', t('doc_additional_2'), false)}
      ${fileUploadField('additional_doc_3', t('doc_additional_3'), false)}
    </div>
  `;

  // Bind file upload events
  container.querySelectorAll('.file-upload').forEach(el => {
    const input = el.querySelector('input[type="file"]');
    el.addEventListener('click', (e) => {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener('change', (e) => {
      const fileName = e.target.files[0]?.name;
      const nameEl = el.querySelector('.file-name');
      if (fileName) {
        nameEl.textContent = fileName;
        el.classList.add('has-file');
      } else {
        nameEl.textContent = '';
        el.classList.remove('has-file');
      }
    });
  });
}

function fileUploadField(name, label, required) {
  return `
    <div class="form-group">
      <label>${label} ${required ? '<span class="required">*</span>' : ''}</label>
      <div class="file-upload">
        <input type="file" name="${name}" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx">
        <div class="upload-icon">📄</div>
        <div class="upload-text">${t('doc_upload_text')}</div>
        <div class="file-name"></div>
      </div>
    </div>
  `;
}

// ========== REVIEW (Step 5) ==========
function buildReview() {
  const container = document.getElementById('review-container');
  container.innerHTML = '';

  let html = `<div class="review-block"><h3>${t('r_society_data')}</h3>`;
  html += reviewRow(t('r_name_1'), getValue('company_name_1'), 'company_name_1');
  html += reviewRow(t('r_name_2'), getValue('company_name_2'), 'company_name_2');
  html += reviewRow(t('r_name_3'), getValue('company_name_3'), 'company_name_3');
  html += reviewRow(t('r_activities'), getValue('company_activities'), 'company_activities');
  html += reviewRow(t('r_contact'), getValue('client_name'), 'client_name');
  html += reviewRow(t('s1_email'), getValue('client_email'), 'client_email');
  html += reviewRow(t('s1_phone'), getValue('client_phone'), 'client_phone');
  html += '</div>';

  // Shareholders
  document.querySelectorAll('#shareholders-container .entity-card').forEach((card, idx) => {
    const id = card.id.replace('shareholder-', '');
    const type = getRadioValue(`sh_type_${id}`);
    const residence = getRadioValue(`sh_residence_${id}`);
    const hasNif = getRadioValue(`sh_has_nif_${id}`);

    html += `<div class="review-block"><h3>${t('sh_label')} ${idx + 1}</h3>`;
    if (type === 'individual') {
      html += reviewRow(t('r_name'), getFieldValue(card, `sh_name_${id}`), `sh_name_${id}`);
      html += reviewRow(t('r_nationality'), getFieldValue(card, `sh_nationality_${id}`), `sh_nationality_${id}`);
      html += reviewRow(t('r_birthplace'), getFieldValue(card, `sh_birthplace_${id}`), `sh_birthplace_${id}`);
      html += reviewRow(t('r_passport'), getFieldValue(card, `sh_doc_number_${id}`), `sh_doc_number_${id}`);
      html += reviewRow(t('r_address'), getFieldValue(card, `sh_address_${id}`), `sh_address_${id}`);
    } else {
      html += reviewRow(t('r_firm'), getFieldValue(card, `sh_corp_name_${id}`), `sh_corp_name_${id}`);
      html += reviewRow(t('r_country'), getFieldValue(card, `sh_corp_country_${id}`), `sh_corp_country_${id}`);
      html += reviewRow(t('r_reg_number'), getFieldValue(card, `sh_corp_reg_${id}`), `sh_corp_reg_${id}`);
      html += reviewRow(t('r_corp_representative'), getFieldValue(card, `sh_corp_representative_${id}`), `sh_corp_representative_${id}`);
      html += reviewRow(t('r_corp_rep_passport'), getFieldValue(card, `sh_corp_representative_passport_${id}`), `sh_corp_representative_passport_${id}`);
      html += reviewRow(t('r_corp_rep_nationality'), getFieldValue(card, `sh_corp_representative_nationality_${id}`), `sh_corp_representative_nationality_${id}`);
      html += reviewRow(t('r_corp_rep_address'), getFieldValue(card, `sh_corp_representative_address_${id}`), `sh_corp_representative_address_${id}`);
    }
    html += reviewRow(t('r_residence'), residence === 'portugal' ? t('r_portugal') : t('r_foreign'));
    html += reviewRow(t('r_nif'), hasNif === 'yes' ? getFieldValue(card, `sh_nif_${id}`) : '', hasNif === 'yes' ? `sh_nif_${id}` : null);
    if (hasNif === 'no') html += reviewRow(t('r_nif'), `<span class="missing">${t('r_nif_pending')}</span>`);
    html += '</div>';
  });

  // Managers
  document.querySelectorAll('#managers-container .entity-card').forEach((card, idx) => {
    const id = card.id.replace('manager-', '');
    const hasNif = getRadioValue(`mg_has_nif_${id}`);

    html += `<div class="review-block"><h3>${t('mg_label')} ${idx + 1}</h3>`;
    html += reviewRow(t('r_name'), getFieldValue(card, `mg_name_${id}`), `mg_name_${id}`);
    html += reviewRow(t('r_nationality'), getFieldValue(card, `mg_nationality_${id}`), `mg_nationality_${id}`);
    html += reviewRow(t('r_birthplace'), getFieldValue(card, `mg_birthplace_${id}`), `mg_birthplace_${id}`);
    html += reviewRow(t('r_passport'), getFieldValue(card, `mg_doc_number_${id}`), `mg_doc_number_${id}`);
    html += reviewRow(t('r_address'), getFieldValue(card, `mg_address_${id}`), `mg_address_${id}`);
    html += reviewRow(t('r_nif'), hasNif === 'yes' ? getFieldValue(card, `mg_nif_${id}`) : '', hasNif === 'yes' ? `mg_nif_${id}` : null);
    if (hasNif === 'no') html += reviewRow(t('r_nif'), `<span class="missing">${t('r_nif_pending')}</span>`);
    html += '</div>';
  });

  // Documents needed
  html += `<div class="review-block"><h3>${t('r_docs_title')}</h3>`;
  const docs = getRequiredDocuments();
  docs.forEach(d => { html += `<div style="padding:4px 0;font-size:.85rem">✓ ${d}</div>`; });
  html += '</div>';

  // Cost estimate
  const costs = calculateCosts();
  if (costs.length > 0) {
    html += `<div class="review-block"><h3>${t('r_costs_title')}</h3>`;
    let total = 0;
    costs.forEach(c => {
      html += `<div class="review-row"><span class="review-label">${c.description}</span><span class="review-value">€${c.amount}${c.recurring ? t('per_year') : ''}</span></div>`;
      total += c.amount;
    });
    html += `<div class="review-row" style="border-top:2px solid #e2e8f0;margin-top:8px;padding-top:8px"><span class="review-label" style="font-weight:600">${t('r_total')}</span><span class="review-value" style="font-weight:700;color:#2563eb">€${total}</span></div>`;
    html += `<p style="font-size:.75rem;color:#888;margin-top:8px">${t('r_costs_note')}</p>`;
    html += `<p style="font-size:.85rem;color:#1e40af;margin-top:12px;font-weight:500">${t('r_invoice_note')}</p>`;
    html += '</div>';
  }

  container.innerHTML = html;

  // Sync review edits back to original form fields
  container.querySelectorAll('.review-input').forEach(input => {
    input.addEventListener('input', function() {
      const fieldName = this.dataset.field;
      const original = document.querySelector(`[name="${fieldName}"]`);
      if (original) original.value = this.value;
    });
  });
}

function getRequiredDocuments() {
  const docs = [t('d_pacto'), t('d_checklist')];

  document.querySelectorAll('#shareholders-container .entity-card').forEach(card => {
    const id = card.id.replace('shareholder-', '');
    const type = getRadioValue(`sh_type_${id}`);
    const residence = getRadioValue(`sh_residence_${id}`);
    const hasNif = getRadioValue(`sh_has_nif_${id}`);

    if (type === 'corporate' && residence === 'foreign') {
      docs.push(t('d_poa_incorp'));
      docs.push(t('d_poa_rnpc'));
      docs.push(t('d_cert_good_standing'));
    }
    if (hasNif === 'no') {
      const name = type === 'individual'
        ? card.querySelector(`[name="sh_name_${id}"]`)?.value
        : card.querySelector(`[name="sh_corp_name_${id}"]`)?.value;
      docs.push(`${t('d_poa_nif')} — ${name || t('sh_label')}`);
    }
  });

  document.querySelectorAll('#managers-container .entity-card').forEach(card => {
    const id = card.id.replace('manager-', '');
    const name = card.querySelector(`[name="mg_name_${id}"]`)?.value || t('mg_label');
    docs.push(`${t('d_carta_gerente')} — ${name}`);
    const hasNif = getRadioValue(`mg_has_nif_${id}`);
    const residence = getRadioValue(`mg_residence_${id}`);
    if (hasNif === 'no') {
      docs.push(`${t('d_poa_nif_short')} — ${name}`);
      if (residence === 'foreign') {
        docs.push(`${t('d_rep_fiscal')} — ${name}`);
      }
    }
  });

  return [...new Set(docs)];
}

// ========== COST CALCULATION ==========
function calculateCosts() {
  const costs = [];

  // Fixed incorporation fee
  costs.push({ description: t('c_incorporation_fee'), amount: 2000, recurring: false });

  document.querySelectorAll('#shareholders-container .entity-card').forEach(card => {
    const id = card.id.replace('shareholder-', '');
    const type = getRadioValue(`sh_type_${id}`);
    const residence = getRadioValue(`sh_residence_${id}`);
    const hasNif = getRadioValue(`sh_has_nif_${id}`);
    const name = type === 'individual'
      ? (card.querySelector(`[name="sh_name_${id}"]`)?.value || t('sh_label'))
      : (card.querySelector(`[name="sh_corp_name_${id}"]`)?.value || t('sh_label'));

    if (hasNif === 'no') {
      const label = type === 'corporate' ? t('c_nipc_request') : t('c_nif_request');
      costs.push({ description: `${label} — ${name}`, amount: 250, recurring: false });
    }
  });

  document.querySelectorAll('#managers-container .entity-card').forEach(card => {
    const id = card.id.replace('manager-', '');
    const hasNif = getRadioValue(`mg_has_nif_${id}`);
    const residence = getRadioValue(`mg_residence_${id}`);
    const name = card.querySelector(`[name="mg_name_${id}"]`)?.value || t('mg_label');

    if (hasNif === 'no') {
      costs.push({ description: `${t('c_nif_request')} — ${name}`, amount: 250, recurring: false });
    }
    if (hasNif === 'no' && residence === 'foreign') {
      costs.push({ description: `${t('c_rep_fiscal')} — ${name}`, amount: 500, recurring: true });
    }
  });

  return costs;
}

// ========== SUBMIT ==========
async function submitForm() {
  const overlay = document.getElementById('loading-overlay');
  overlay.classList.add('visible');

  try {
    // 1. Collect all form data as a plain object
    const data = {};
    const allInputs = document.querySelectorAll('input, select, textarea');
    allInputs.forEach(input => {
      if (input.type === 'file') return; // files handled separately
      if (input.type === 'radio') {
        if (input.checked) data[input.name] = input.value;
      } else if (input.name && input.value) {
        data[input.name] = input.value;
      }
    });

    data.language = currentLang;
    data.submission_date = new Date().toISOString();
    data.required_documents = JSON.stringify(getRequiredDocuments());
    data.estimated_costs = JSON.stringify(calculateCosts());

    // Include pending file IDs from Smart Upload
    if (pendingFileIds.length > 0) {
      data.pending_file_ids = JSON.stringify(pendingFileIds);
    }

    // 2. Submit form data as JSON
    // Google Apps Script redirects POST requests, so we need redirect: 'follow'
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'submitForm', data: data }),
      redirect: 'follow'
    });

    const responseText = await response.text();
    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      throw new Error(t('invalid_server_response'));
    }
    if (result.status !== 'success') throw new Error(result.message || t('server_error'));

    const clientFolderId = result.folderId;

    // 3. Upload files as base64 (Step 4 file inputs)
    const fileInputs = document.querySelectorAll('#uploads-container input[type="file"]');
    const filesToUpload = [];

    for (const input of fileInputs) {
      if (!input.files || input.files.length === 0) continue;
      const file = input.files[0];
      const base64 = await fileToBase64(file);
      // Determine category from input name (sh_passport_1 → docs_socios, mg_passport_1 → docs_gerentes)
      let category = 'outros';
      if (input.name.startsWith('sh_')) category = 'docs_socios';
      else if (input.name.startsWith('mg_')) category = 'docs_gerentes';
      else if (input.name.startsWith('additional_')) category = 'outros';

      filesToUpload.push({
        name: file.name,
        data: base64,
        mimeType: file.type,
        category: category,
        fieldName: input.name
      });
    }

    if (filesToUpload.length > 0 && clientFolderId) {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'uploadFiles',
          folderId: clientFolderId,
          files: filesToUpload
        }),
        redirect: 'follow'
      });
    }

    // 4. Move Smart Upload pending files to client folder
    if (pendingFileIds.length > 0 && clientFolderId) {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'movePendingFiles',
          fileIds: pendingFileIds,
          clientFolderId: clientFolderId
        }),
        redirect: 'follow'
      });
    }

    overlay.classList.remove('visible');
    document.getElementById('success-overlay').classList.add('visible');
  } catch (error) {
    overlay.classList.remove('visible');
    alert(t('v_submit_error') + '\n\nError: ' + error.message);
  }
}

// ========== HELPERS ==========
function selectRadio(label) {
  const group = label.closest('.radio-group');
  group.querySelectorAll('.radio-option').forEach(opt => opt.classList.remove('selected'));
  label.classList.add('selected');
}

function getRadioValue(name) {
  const el = document.querySelector(`input[name="${name}"]:checked`);
  return el ? el.value : '';
}

function getValue(name) {
  const el = document.querySelector(`[name="${name}"]`);
  return el ? el.value : '';
}

function getFieldValue(container, name) {
  const el = container.querySelector(`[name="${name}"]`);
  return el ? el.value : '';
}

function toggleRequired(container, enable) {
  container.querySelectorAll('input, select').forEach(el => {
    if (el.closest('.conditional:not(.visible)')) return;
    const label = el.closest('.form-group')?.querySelector('.required');
    if (label) {
      if (enable && container.classList.contains('visible')) el.setAttribute('required', '');
      else el.removeAttribute('required');
    }
  });
}

function renumberEntities(containerId, prefix) {
  const container = document.getElementById(containerId);
  container.querySelectorAll('.entity-card h3').forEach((h3, idx) => {
    const badge = h3.querySelector('.badge');
    const badgeHtml = badge ? badge.outerHTML : '';
    h3.innerHTML = `${prefix} ${idx + 1} ${badgeHtml}`;
  });
}

function reviewRow(label, value, fieldName) {
  if (fieldName) {
    const escaped = escapeHtml(value || '');
    return `<div class="review-row editable">
      <span class="review-label">${label}</span>
      <input type="text" class="review-input" data-field="${fieldName}" value="${escaped}" placeholder="${t('r_not_filled')}">
    </div>`;
  }
  const display = value || `<span class="missing">${t('r_not_filled')}</span>`;
  return `<div class="review-row"><span class="review-label">${label}</span><span class="review-value">${display}</span></div>`;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ========== SMART UPLOAD ==========
let suPartyCounter = 0;
let suParties = []; // { id, name, role, type }

function initSmartUpload() {
  // Smart Upload init — zones are created dynamically
}

function buildSmartUploadPartyHTML(id) {
  return `
    <button type="button" class="su-party-remove" onclick="removeSmartUploadParty(${id})">&times;</button>
    <div class="form-group su-party-name">
      <input type="text" placeholder="${t('su_party_name_ph')}" onchange="updateSmartUploadParty(${id}, 'name', this.value)">
    </div>
    <div class="su-party-options">
      <div class="su-mini-group">
        <label>${t('su_party_type')}</label>
        <div class="su-mini-radios">
          <label class="su-mini-radio selected" onclick="selectSuRadio(this)">
            <input type="radio" name="su_type_${id}" value="individual" checked onchange="updateSmartUploadParty(${id}, 'type', 'individual')">
            ${t('su_party_type_ind')}
          </label>
          <label class="su-mini-radio" onclick="selectSuRadio(this)">
            <input type="radio" name="su_type_${id}" value="corporate" onchange="updateSmartUploadParty(${id}, 'type', 'corporate')">
            ${t('su_party_type_corp')}
          </label>
        </div>
      </div>
    </div>
  `;
}

function addSmartUploadParty() {
  suPartyCounter++;
  const id = suPartyCounter;
  suParties.push({ id, name: '', role: 'shareholder', type: 'individual' });

  const list = document.getElementById('su-parties-list');
  const row = document.createElement('div');
  row.className = 'su-party-row';
  row.id = `su-party-${id}`;
  row.innerHTML = buildSmartUploadPartyHTML(id);
  list.appendChild(row);
  renderSmartUploadCategories();
}

function removeSmartUploadParty(id) {
  document.getElementById(`su-party-${id}`)?.remove();
  suParties = suParties.filter(p => p.id !== id);
  renderSmartUploadCategories();
}

function updateSmartUploadParty(id, field, value) {
  const party = suParties.find(p => p.id === id);
  if (party) {
    party[field] = value;
    renderSmartUploadCategories();
  }
}

function selectSuRadio(label) {
  const group = label.closest('.su-mini-radios');
  group.querySelectorAll('.su-mini-radio').forEach(r => r.classList.remove('selected'));
  label.classList.add('selected');
}

function renderSmartUploadCategories() {
  const container = document.getElementById('su-upload-categories');
  container.innerHTML = '';

  if (suParties.length === 0) {
    document.getElementById('su-continue-btn').disabled = true;
    return;
  }

  suParties.forEach(party => {
    const displayName = party.name || `${t('su_party_role_' + (party.role === 'manager' ? 'mg' : party.role === 'both' ? 'both' : 'sh'))} ${party.id}`;
    const card = document.createElement('div');
    card.className = 'entity-card';
    card.id = `su-uploads-${party.id}`;

    let slotsHtml = `<h3>${t('su_docs_for')} — ${escapeHtml(displayName)}</h3>`;

    if (party.type === 'individual') {
      slotsHtml += buildCategorySlot(party.id, 'passport', t('su_cat_passport'), true);
      slotsHtml += buildCategorySlot(party.id, 'proof_of_address', t('su_cat_proof_address'), true);
    } else {
      slotsHtml += buildCategorySlot(party.id, 'good_standing', t('su_cat_good_standing'), true);
    }

    card.innerHTML = slotsHtml;
    container.appendChild(card);
    initCategoryZones(card);
  });

  checkSmartUploadContinue();
}

function buildCategorySlot(partyId, category, label, required) {
  return `
    <div class="su-category-slot" data-party="${partyId}" data-category="${category}">
      <label>${label} ${required ? '<span class="required">*</span>' : '<span class="hint">' + t('su_optional') + '</span>'}</label>
      <div class="su-category-zone">
        <input type="file" accept=".pdf,.jpg,.jpeg,.png" multiple>
        <div class="drop-text">${t('su_upload_here')}</div>
      </div>
      <div class="su-file-list"></div>
    </div>
  `;
}

function initCategoryZones(container) {
  if (!container) return;
  container.querySelectorAll('.su-category-zone').forEach(zone => {
    if (zone.dataset.initialized) return;
    zone.dataset.initialized = 'true';

    const input = zone.querySelector('input[type="file"]');
    zone.addEventListener('click', (e) => {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleCategoryFiles(zone, input.files);
        input.value = '';
      }
    });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handleCategoryFiles(zone, e.dataTransfer.files);
    });
  });
}

async function handleCategoryFiles(zone, fileList) {
  const slot = zone.closest('.su-category-slot');
  const fileListContainer = slot.querySelector('.su-file-list');
  const partyId = slot.dataset.party;
  const category = slot.dataset.category;

  for (const file of fileList) {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!validTypes.includes(file.type)) continue;

    // Add file item to list
    const itemId = 'sf-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5);
    const item = document.createElement('div');
    item.className = 'su-file-item';
    item.id = itemId;
    item.innerHTML = `
      <span>${'📄'}</span>
      <span class="su-file-name">${escapeHtml(file.name)}</span>
      <span class="su-file-status extracting">${t('su_status_extracting')}</span>
      <div class="su-file-spinner"></div>
    `;
    fileListContainer.appendChild(item);
    zone.classList.add('has-file');

    try {
      const base64 = await fileToBase64(file);

      // Try extraction, but don't block if it fails
      let extractionSuccess = false;
      try {
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain' },
          body: JSON.stringify({
            action: 'extractDocument',
            base64Data: base64,
            mimeType: file.type,
            fileName: file.name,
            documentCategory: category
          })
        });
        const result = await response.json();
        if (result.status === 'success' && result.extraction) {
          extractedData.push({ fileName: file.name, partyId, category, ...result.extraction });
          if (result.fileId) pendingFileIds.push(result.fileId);
          extractionSuccess = true;
          renderExtractionPreview();
        }
      } catch (err) {
        console.warn('Extraction failed (non-blocking):', err);
      }

      // Mark file as uploaded regardless of extraction result
      smartUploadFiles[file.name] = { base64, mimeType: file.type, partyId, category };
      const statusEl = item.querySelector('.su-file-status');
      statusEl.className = 'su-file-status';
      statusEl.textContent = '✓ ' + t('su_status_done');
      statusEl.style.color = '#16a34a';
      item.querySelector('.su-file-spinner')?.remove();

    } catch (err) {
      console.error('Smart upload error:', err);
      const statusEl = item.querySelector('.su-file-status');
      if (statusEl) {
        statusEl.className = 'su-file-status';
        statusEl.style.color = '#dc2626';
        statusEl.textContent = t('su_status_error');
      }
      item.querySelector('.su-file-spinner')?.remove();
    }
  }

  checkSmartUploadContinue();
}

function checkSmartUploadContinue() {
  // Enable continue if all required slots have at least one file
  let allReady = suParties.length > 0;
  document.querySelectorAll('#su-upload-categories .su-category-slot').forEach(slot => {
    const hasRequired = slot.querySelector('.required');
    if (hasRequired) {
      const hasFiles = slot.querySelector('.su-file-item');
      if (!hasFiles) allReady = false;
    }
  });
  document.getElementById('su-continue-btn').disabled = !allReady;
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderExtractionPreview() {
  const previewContainer = document.getElementById('extraction-preview');
  const cardsContainer = document.getElementById('extraction-cards');
  previewContainer.style.display = 'block';
  cardsContainer.innerHTML = '';

  extractedData.forEach((data, idx) => {
    const docTypeKey = 'su_doc_type_' + (data.document_type || 'other');
    const docTypeLabel = t(docTypeKey);

    let card = `<div class="extraction-card">
      <h4>
        ${escapeHtml(data.fileName || t('document_fallback') + ' ' + (idx + 1))}
        <span class="doc-type-badge">${docTypeLabel}</span>
      </h4>`;

    if (data.extracted_fields) {
      const fieldLabels = {
        full_name: t('f_fullname'),
        nationality: t('f_nationality'),
        place_of_birth: t('f_birthplace'),
        date_of_birth: t('f_dob'),
        document_number: t('f_doc_number'),
        issuing_authority: t('f_doc_issuer'),
        issue_date: t('f_doc_issue'),
        expiry_date: t('f_doc_expiry'),
        address: t('f_address'),
        company_name: t('f_corp_name'),
        registration_number: t('f_corp_reg'),
        country_of_incorporation: t('f_corp_country'),
        company_type: t('f_corp_type'),
        registered_address: t('f_corp_address')
      };

      Object.entries(data.extracted_fields).forEach(([key, field]) => {
        if (!field || !field.value) return;
        const label = fieldLabels[key] || key;
        const conf = field.confidence || 'medium';
        const confLabel = t('su_confidence_' + conf);
        card += `<div class="extraction-row">
          <span class="ext-label">${label}</span>
          <span class="ext-value">${escapeHtml(field.value)}</span>
          <span class="confidence-badge ${conf}">${confLabel}</span>
        </div>`;
      });
    }

    card += '</div>';
    cardsContainer.innerHTML += card;
  });
}

function continueFromSmartUpload() {
  // Hide Smart Upload, show Step 1
  document.getElementById('step-smart-upload').classList.remove('active');
  currentStep = 1;
  document.getElementById('step-1').classList.add('active');
  showProgressBar();
  updateProgress();

  // Pre-create shareholders and managers from party list
  suParties.forEach(party => {
    if (party.role === 'shareholder' || party.role === 'both') {
      addShareholder();
      const shId = shareholderCounter;
      const shType = party.type === 'corporate' ? 'corporate' : 'individual';
      setRadioAndTrigger(`sh_type_${shId}`, shType);
      setRadioAndTrigger(`sh_residence_${shId}`, 'foreign');
      setRadioAndTrigger(`sh_has_nif_${shId}`, 'no');
    }
    if (party.role === 'manager' || party.role === 'both') {
      addManager();
      const mgId = managerCounter;
      setRadioAndTrigger(`mg_residence_${mgId}`, 'foreign');
      setRadioAndTrigger(`mg_has_nif_${mgId}`, 'no');
    }
  });

  // Fallbacks
  if (shareholderCounter === 0) addShareholder();
  if (managerCounter === 0) addManager();

  // Prefill form with extracted data
  prefillFormFromExtraction();

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prefillFormFromExtraction() {
  if (extractedData.length === 0) return;

  // Show prefill info box at top of Step 1
  const step1 = document.getElementById('step-1');
  const existingInfo = step1.querySelector('.prefill-info');
  if (!existingInfo) {
    const infoBox = document.createElement('div');
    infoBox.className = 'info-box prefill-info';
    infoBox.style.background = '#eff6ff';
    infoBox.style.borderColor = '#bfdbfe';
    infoBox.innerHTML = t('su_prefill_info');
    step1.querySelector('.info-box').after(infoBox);
  }

  // Separate extractions by type
  const passports = extractedData.filter(d =>
    d.document_type === 'passport' || d.document_type === 'id_card'
  );
  const goodStandings = extractedData.filter(d =>
    d.document_type === 'good_standing'
  );

  // Track how many shareholders/managers we've created
  let shIdx = 0;
  let mgIdx = 0;

  // Process Good Standing certificates → corporate shareholders
  goodStandings.forEach(gs => {
    const fields = gs.extracted_fields || {};
    // Ensure we have a shareholder card
    shIdx++;
    if (shIdx > shareholderCounter) addShareholder();
    const id = shIdx;

    // Select "corporate" type
    setRadioAndTrigger(`sh_type_${id}`, 'corporate');
    // Select "foreign" residence
    setRadioAndTrigger(`sh_residence_${id}`, 'foreign');

    // Fill corporate fields
    setFieldIfExists(`sh_corp_name_${id}`, fields.company_name);
    setFieldIfExists(`sh_corp_type_${id}`, fields.company_type);
    setFieldIfExists(`sh_corp_country_${id}`, fields.country_of_incorporation);
    setFieldIfExists(`sh_corp_reg_${id}`, fields.registration_number);
    setFieldIfExists(`sh_corp_address_${id}`, fields.registered_address);

    // Set NIF to "no" for foreign corporate
    setRadioAndTrigger(`sh_has_nif_${id}`, 'no');
  });

  // Process passports → individual shareholders or managers
  passports.forEach((passport, pIdx) => {
    const fields = passport.extracted_fields || {};

    if (pIdx === 0 && goodStandings.length > 0) {
      // First passport goes as a manager (typical: company is shareholder, person is director)
      mgIdx++;
      if (mgIdx > managerCounter) addManager();
      const id = mgIdx;

      setFieldIfExists(`mg_name_${id}`, fields.full_name);
      setFieldIfExists(`mg_nationality_${id}`, fields.nationality);
      setFieldIfExists(`mg_birthplace_${id}`, fields.place_of_birth);
      setFieldIfExists(`mg_dob_${id}`, fields.date_of_birth);
      setFieldIfExists(`mg_doc_number_${id}`, fields.document_number);
      setFieldIfExists(`mg_doc_issuer_${id}`, fields.issuing_authority);
      setFieldIfExists(`mg_doc_issue_${id}`, fields.issue_date);
      setFieldIfExists(`mg_doc_expiry_${id}`, fields.expiry_date);
      setFieldIfExists(`mg_address_${id}`, fields.address);

      // Foreign by default
      setRadioAndTrigger(`mg_residence_${id}`, 'foreign');
      setRadioAndTrigger(`mg_has_nif_${id}`, 'no');
    } else {
      // Additional passports → individual shareholders
      shIdx++;
      if (shIdx > shareholderCounter) addShareholder();
      const id = shIdx;

      setRadioAndTrigger(`sh_type_${id}`, 'individual');
      setRadioAndTrigger(`sh_residence_${id}`, 'foreign');

      setFieldIfExists(`sh_name_${id}`, fields.full_name);
      setFieldIfExists(`sh_nationality_${id}`, fields.nationality);
      setFieldIfExists(`sh_birthplace_${id}`, fields.place_of_birth);
      setFieldIfExists(`sh_dob_${id}`, fields.date_of_birth);
      setFieldIfExists(`sh_doc_number_${id}`, fields.document_number);
      setFieldIfExists(`sh_doc_issuer_${id}`, fields.issuing_authority);
      setFieldIfExists(`sh_doc_issue_${id}`, fields.issue_date);
      setFieldIfExists(`sh_doc_expiry_${id}`, fields.expiry_date);
      setFieldIfExists(`sh_address_${id}`, fields.address);

      setRadioAndTrigger(`sh_has_nif_${id}`, 'no');
    }
  });

  // If no Good Standing but we have passports, first passport = shareholder, rest = depends
  if (goodStandings.length === 0 && passports.length > 0) {
    // Already handled above: passports go as individual shareholders
    // Make first passport also a manager if none set
    if (mgIdx === 0 && passports.length > 0) {
      const fields = passports[0].extracted_fields || {};
      const id = 1; // First manager already exists
      setFieldIfExists(`mg_name_${id}`, fields.full_name);
      setFieldIfExists(`mg_nationality_${id}`, fields.nationality);
      setFieldIfExists(`mg_birthplace_${id}`, fields.place_of_birth);
      setFieldIfExists(`mg_dob_${id}`, fields.date_of_birth);
      setFieldIfExists(`mg_doc_number_${id}`, fields.document_number);
      setFieldIfExists(`mg_doc_issuer_${id}`, fields.issuing_authority);
      setFieldIfExists(`mg_doc_issue_${id}`, fields.issue_date);
      setFieldIfExists(`mg_doc_expiry_${id}`, fields.expiry_date);
      setFieldIfExists(`mg_address_${id}`, fields.address);
      setRadioAndTrigger(`mg_residence_${id}`, 'foreign');
      setRadioAndTrigger(`mg_has_nif_${id}`, 'no');
    }
  }
}

// ========== INLINE DOCUMENT UPLOAD + EXTRACTION ==========
function buildInlineUpload(entityType, id, docType) {
  let titleKey, hintKey;
  if (entityType === 'sh_rep') {
    titleKey = 'f_corp_rep_upload';
    hintKey = 'f_corp_rep_upload_hint';
  } else if (docType === 'corporate') {
    titleKey = 'sh_upload_corp_doc';
    hintKey = 'sh_upload_corp_hint';
  } else if (docType === 'proof_of_address') {
    titleKey = 'mg_upload_address';
    hintKey = 'mg_upload_address_hint';
  } else if (entityType === 'mg') {
    titleKey = 'mg_upload_id';
    hintKey = 'mg_upload_id_hint';
  } else {
    titleKey = 'sh_upload_id';
    hintKey = 'sh_upload_id_hint';
  }
  const zoneId = `${entityType}-dropzone-${docType}-${id}`;
  const statusId = `${entityType}-upload-status-${docType}-${id}`;

  return `
    <div class="inline-upload-section">
      <div class="form-group">
        <label>${t(titleKey)}</label>
        <p class="hint">${t(hintKey)}</p>
        <div class="su-category-zone" id="${zoneId}" data-entity="${entityType}" data-entity-id="${id}" data-doc-type="${docType}">
          <input type="file" accept=".pdf,.jpg,.jpeg,.png">
          <div class="drop-text">${t('upload_drop_text')}</div>
        </div>
        <div class="inline-upload-status" id="${statusId}" style="display:none"></div>
      </div>
      <p class="hint" style="text-align:center;margin-bottom:16px;color:#888">${t('upload_or_fill')}</p>
    </div>
  `;
}

function initInlineUpload(entityType, id) {
  // Initialize all dropzones for this entity (individual + corporate for shareholders)
  var cardId = entityType === 'sh' || entityType === 'sh_rep' ? 'shareholder' : 'manager';
  const card = document.getElementById(`${cardId}-${id}`);
  if (!card) return;
  card.querySelectorAll('.su-category-zone').forEach(zone => {
    if (zone.dataset.initialized) return;
    zone.dataset.initialized = 'true';

    const input = zone.querySelector('input[type="file"]');
    zone.addEventListener('click', (e) => {
      if (e.target === input) return;
      input.click();
    });
    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        handleInlineUpload(zone, input.files[0]);
        input.value = '';
      }
    });
    zone.addEventListener('dragover', (e) => { e.preventDefault(); zone.classList.add('dragover'); });
    zone.addEventListener('dragleave', () => { zone.classList.remove('dragover'); });
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) handleInlineUpload(zone, e.dataTransfer.files[0]);
    });
  });
}

async function handleInlineUpload(zone, file) {
  const entityType = zone.dataset.entity; // 'sh' or 'mg'
  const entityId = zone.dataset.entityId;
  const docType = zone.dataset.docType;
  const statusEl = document.getElementById(`${entityType}-upload-status-${docType}-${entityId}`);

  // Show file uploaded
  zone.classList.add('has-file');
  zone.querySelector('.drop-text').textContent = '✓ ' + file.name;

  try {
    const base64 = await fileToBase64(file);

    // Store file for later submission
    smartUploadFiles[`${entityType}_doc_${entityId}`] = { base64, mimeType: file.type, fileName: file.name };

    // When document is uploaded, make fields optional (extraction will fill them)
    const entityCard = zone.closest('.entity-card');
    if (entityCard) {
      entityCard.classList.add('has-document');
      entityCard.querySelectorAll('input[required], select[required]').forEach(el => {
        el.removeAttribute('required');
        el.dataset.wasRequired = 'true';
      });
    }

    // Try extraction in background (non-blocking, best-effort)
    statusEl.style.display = 'block';
    statusEl.innerHTML = `<div class="info-box" style="display:flex;align-items:center;gap:8px"><div class="su-file-spinner"></div> ${t('upload_extracting')}</div>`;

    try {
      const response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({
          action: 'extractDocument',
          base64Data: base64,
          mimeType: file.type,
          fileName: file.name,
          documentCategory: docType
        }),
        redirect: 'follow'
      });
      const responseText = await response.text();
      const result = JSON.parse(responseText);
      if (result.status === 'success' && result.extraction && result.extraction.extracted_fields) {
        const fields = result.extraction.extracted_fields;
        if (result.fileId) pendingFileIds.push(result.fileId);

        if (entityType === 'sh' && docType !== 'corporate') {
          setFieldIfExists(`sh_name_${entityId}`, fields.full_name);
          setFieldIfExists(`sh_nationality_${entityId}`, fields.nationality);
          setFieldIfExists(`sh_birthplace_${entityId}`, fields.place_of_birth);
          setFieldIfExists(`sh_dob_${entityId}`, fields.date_of_birth);
          setFieldIfExists(`sh_doc_number_${entityId}`, fields.document_number);
          setFieldIfExists(`sh_doc_issuer_${entityId}`, fields.issuing_authority);
          setFieldIfExists(`sh_doc_issue_${entityId}`, fields.issue_date);
          setFieldIfExists(`sh_doc_expiry_${entityId}`, fields.expiry_date);
          setFieldIfExists(`sh_address_${entityId}`, fields.address);
        } else if (entityType === 'sh' && docType === 'corporate') {
          setFieldIfExists(`sh_corp_name_${entityId}`, fields.company_name);
          setFieldIfExists(`sh_corp_type_${entityId}`, fields.company_type);
          setFieldIfExists(`sh_corp_country_${entityId}`, fields.country_of_incorporation);
          setFieldIfExists(`sh_corp_reg_${entityId}`, fields.registration_number);
          setFieldIfExists(`sh_corp_address_${entityId}`, fields.registered_address);
        } else if (entityType === 'sh_rep') {
          // Corporate legal representative passport
          setFieldIfExists(`sh_corp_representative_${entityId}`, fields.full_name);
          setFieldIfExists(`sh_corp_representative_passport_${entityId}`, fields.document_number);
          setFieldIfExists(`sh_corp_representative_nationality_${entityId}`, fields.nationality);
          setFieldIfExists(`sh_corp_representative_address_${entityId}`, fields.address);
        } else if (entityType === 'mg' && docType === 'proof_of_address') {
          // Proof of address — only fill address field
          setFieldIfExists(`mg_address_${entityId}`, fields.address);
        } else if (entityType === 'mg') {
          // Passport / ID — fill personal details
          setFieldIfExists(`mg_name_${entityId}`, fields.full_name);
          setFieldIfExists(`mg_nationality_${entityId}`, fields.nationality);
          setFieldIfExists(`mg_birthplace_${entityId}`, fields.place_of_birth);
          setFieldIfExists(`mg_dob_${entityId}`, fields.date_of_birth);
          setFieldIfExists(`mg_doc_number_${entityId}`, fields.document_number);
          setFieldIfExists(`mg_doc_issuer_${entityId}`, fields.issuing_authority);
          setFieldIfExists(`mg_doc_issue_${entityId}`, fields.issue_date);
          setFieldIfExists(`mg_doc_expiry_${entityId}`, fields.expiry_date);
          setFieldIfExists(`mg_address_${entityId}`, fields.address);
        }
        statusEl.innerHTML = `<div class="info-box success">${t('upload_extracted')}</div>`;
      } else {
        // Extraction didn't return data — ask client to fill in key fields
        statusEl.innerHTML = `<div class="info-box warning">${t('upload_no_data')}</div>`;
      }
    } catch (err) {
      // Extraction service unavailable — ask client to fill in
      console.warn('Extraction not available:', err.message);
      statusEl.innerHTML = `<div class="info-box warning">${t('upload_no_data')}</div>`;
    }
  } catch (err) {
    console.error('File read error:', err);
    zone.classList.remove('has-file');
    zone.querySelector('.drop-text').textContent = t('upload_drop_text');
  }
}

function setFieldIfExists(name, fieldData) {
  if (!fieldData) return;
  const value = typeof fieldData === 'object' ? fieldData.value : fieldData;
  if (!value) return;

  const el = document.querySelector(`[name="${name}"]`);
  if (!el) return;
  el.value = value;

  // Mark as prefilled
  const group = el.closest('.form-group');
  if (group) group.classList.add('prefilled');
}

function setRadioAndTrigger(name, value) {
  const radio = document.querySelector(`input[name="${name}"][value="${value}"]`);
  if (!radio) return;
  radio.checked = true;

  // Select visual style
  const label = radio.closest('.radio-option');
  if (label) selectRadio(label);

  // Trigger onchange
  radio.dispatchEvent(new Event('change'));
}

// ========== LANGUAGE-SWITCH: REBUILD DYNAMIC CARDS ==========
function rebuildDynamicCards() {
  // Rebuild each shareholder card preserving form values
  document.querySelectorAll('#shareholders-container .entity-card').forEach(card => {
    const id = card.id.replace('shareholder-', '');
    const saved = saveCardValues(card);
    card.innerHTML = buildShareholderHTML(id);
    restoreCardValues(card, saved);
    initInlineUpload('sh', id);
  });

  // Rebuild each manager card preserving form values
  document.querySelectorAll('#managers-container .entity-card').forEach(card => {
    const id = card.id.replace('manager-', '');
    const saved = saveCardValues(card);
    card.innerHTML = buildManagerHTML(id);
    restoreCardValues(card, saved);
    initInlineUpload('mg', id);
  });

  // Rebuild Smart Upload party rows (preserving input values from suParties array)
  document.querySelectorAll('#su-parties-list .su-party-row').forEach(row => {
    const id = parseInt(row.id.replace('su-party-', ''), 10);
    const party = suParties.find(p => p.id === id);
    if (!party) return;
    const nameVal = row.querySelector('input[type="text"]')?.value || '';
    row.innerHTML = buildSmartUploadPartyHTML(id);
    const nameInput = row.querySelector('input[type="text"]');
    if (nameInput) nameInput.value = nameVal;
    // Restore radio selections
    const roleRadio = row.querySelector(`input[name="su_role_${id}"][value="${party.role}"]`);
    if (roleRadio) { roleRadio.checked = true; const lbl = roleRadio.closest('.su-mini-radio'); if (lbl) selectSuRadio(lbl); }
    const typeRadio = row.querySelector(`input[name="su_type_${id}"][value="${party.type}"]`);
    if (typeRadio) { typeRadio.checked = true; const lbl = typeRadio.closest('.su-mini-radio'); if (lbl) selectSuRadio(lbl); }
  });

  // Rebuild upload category labels (non-destructive — only update text nodes)
  renderSmartUploadCategories();

  // Rebuild extraction preview if visible
  if (extractedData.length > 0) {
    renderExtractionPreview();
  }
}

function saveCardValues(card) {
  const values = {};
  card.querySelectorAll('input, select, textarea').forEach(el => {
    if (el.type === 'file') return;
    if (el.type === 'radio') {
      if (el.checked) values['radio__' + el.name] = el.value;
    } else if (el.name) {
      values[el.name] = el.value;
    }
  });
  // Save which conditional sections are visible
  const visibles = [];
  card.querySelectorAll('.conditional.visible').forEach(div => {
    if (div.id) visibles.push(div.id);
  });
  values.__visibles = visibles;
  return values;
}

function restoreCardValues(card, saved) {
  // Restore text/select values
  Object.entries(saved).forEach(([key, val]) => {
    if (key === '__visibles') return;
    if (key.startsWith('radio__')) {
      const radioName = key.replace('radio__', '');
      const radio = card.querySelector(`input[name="${radioName}"][value="${val}"]`);
      if (radio) {
        radio.checked = true;
        const label = radio.closest('.radio-option');
        if (label) selectRadio(label);
      }
    } else {
      const el = card.querySelector(`[name="${key}"]`);
      if (el) el.value = val;
    }
  });
  // Restore conditional visibility
  if (saved.__visibles) {
    saved.__visibles.forEach(divId => {
      const div = document.getElementById(divId);
      if (div) div.classList.add('visible');
    });
  }
  // Restore required attributes for visible sections
  card.querySelectorAll('.conditional.visible').forEach(div => {
    div.querySelectorAll('input, select').forEach(el => {
      const label = el.closest('.form-group')?.querySelector('.required');
      if (label) el.setAttribute('required', '');
    });
  });
}

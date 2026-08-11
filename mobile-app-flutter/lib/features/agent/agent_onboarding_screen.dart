import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/constants/listing_options.dart';
import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../data/repositories/agent_repository.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import 'post_form_widgets.dart';

const _stepLabels = ['personal', 'contact', 'identity', 'education', 'professional', 'submit'];
const _regions = ethiopianRegions;
const _genderOptions = ['Male', 'Female', 'Other'];
const _languageOptions = ['English', 'Afaan Oromo', 'Amharic'];
const _educationOptions = [
  'Grade 10',
  'Grade 12',
  'TVET Certificate',
  'Diploma',
  "Bachelor's Degree",
  "Master's Degree",
  'PhD',
];
const _experienceOptions = [
  'Less than 1 year',
  '1–3 years',
  '3–5 years',
  '5–10 years',
  'More than 10 years',
];

/// Agent/Owner onboarding wizard mirroring web/app/agent/onboarding/page.tsx.
///
/// Six steps (Personal, Contact, Identity, Education, Professional, Submit).
/// Step 1 collects whether the user registers as an Agent or an Owner (shown
/// under the Gender field); Step 6 requires accepting the applicable Terms &
/// Conditions (owner/agent) and the Privacy Policy.
class AgentOnboardingScreen extends StatefulWidget {
  const AgentOnboardingScreen({super.key});

  @override
  State<AgentOnboardingScreen> createState() => _AgentOnboardingScreenState();
}

class _AgentOnboardingScreenState extends State<AgentOnboardingScreen> {
  int _step = 0;
  bool _saving = false;
  String? _error;
  String? _uploading;
  bool _agreedTerms = false;
  bool _agreedPrivacy = false;

  // Step 1 – Personal
  late final TextEditingController _fullName;
  late final TextEditingController _dob;
  late final TextEditingController _nationality;
  String _userType = '';
  String _gender = '';
  String _language = '';

  // Step 2 – Contact
  late final TextEditingController _ethPhone;
  late final TextEditingController _safaricomPhone;
  late final TextEditingController _city;
  late final TextEditingController _woreda;
  late final TextEditingController _kebele;
  late final TextEditingController _fullAddress;
  String _region = '';

  // Step 3 – Identity files
  String? _faydaFront;
  String? _faydaBack;
  String? _selfie;
  String? _passport;

  // Step 4 – Education
  String _education = '';
  String? _eduCert;

  // Step 5 – Professional
  late final TextEditingController _experience;
  late final TextEditingController _company;
  late final TextEditingController _officeAddr;
  late final TextEditingController _licenseNum;
  late final TextEditingController _tin;
  String? _licenseFile;

  @override
  void initState() {
    super.initState();
    _fullName = TextEditingController();
    _dob = TextEditingController();
    _nationality = TextEditingController(text: 'Ethiopian');
    _ethPhone = TextEditingController();
    _safaricomPhone = TextEditingController();
    _city = TextEditingController();
    _woreda = TextEditingController();
    _kebele = TextEditingController();
    _fullAddress = TextEditingController();
    _experience = TextEditingController();
    _company = TextEditingController();
    _officeAddr = TextEditingController();
    _licenseNum = TextEditingController();
    _tin = TextEditingController();
  }

  @override
  void dispose() {
    for (final c in [
      _fullName, _dob, _nationality, _ethPhone, _safaricomPhone, _city, _woreda,
      _kebele, _fullAddress, _experience, _company, _officeAddr, _licenseNum, _tin,
    ]) {
      c.dispose();
    }
    super.dispose();
  }

  void _snack(String message) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }

  Future<void> _pickDob() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: DateTime(2000, 1, 1),
      firstDate: DateTime(1920),
      lastDate: now,
    );
    if (picked != null) {
      final m = picked.month.toString().padLeft(2, '0');
      final d = picked.day.toString().padLeft(2, '0');
      setState(() => _dob.text = '${picked.year}-$m-$d');
    }
  }

  Future<void> _pickFile(String field) async {
    setState(() => _uploading = field);
    try {
      final url = await pickAndUploadImage(
        context.read<ApiClient>(),
        endpoint: '/api/agent/upload',
        field: field,
      );
      if (!mounted) return;
      setState(() {
        switch (field) {
          case 'faydaFront':
            _faydaFront = url;
            break;
          case 'faydaBack':
            _faydaBack = url;
            break;
          case 'selfie':
            _selfie = url;
            break;
          case 'passport':
            _passport = url;
            break;
          case 'eduCert':
            _eduCert = url;
            break;
          case 'license':
            _licenseFile = url;
            break;
        }
      });
    } on ImagePickCancelled {
      // user backed out of the picker
    } on ApiException catch (e) {
      _snack('Upload failed: ${e.message}');
    } catch (e) {
      _snack('Upload failed: $e');
    } finally {
      if (mounted) setState(() => _uploading = null);
    }
  }

  void _clearFile(String field) {
    setState(() {
      switch (field) {
        case 'faydaFront':
          _faydaFront = null;
          break;
        case 'faydaBack':
          _faydaBack = null;
          break;
        case 'selfie':
          _selfie = null;
          break;
        case 'passport':
          _passport = null;
          break;
        case 'eduCert':
          _eduCert = null;
          break;
        case 'license':
          _licenseFile = null;
          break;
      }
    });
  }

  Future<void> _next() async {
    final t = context.read<LanguageProvider>().t;
    setState(() => _error = null);
    final repo = context.read<AgentRepository>();

    switch (_step) {
      case 0:
        if (_fullName.text.trim().isEmpty) {
          setState(() => _error = 'Full name is required.');
          return;
        }
        if (_userType.isEmpty) {
          setState(() => _error = 'Please select whether you are registering as an Agent or an Owner.');
          return;
        }
        if (!await _saveStep(repo, {
              'fullName': _fullName.text.trim(),
              'gender': _gender,
              'userType': _userType == 'owner' ? 'Owner' : 'Agent',
              'dateOfBirth': _dob.text.trim(),
              'nationality': _nationality.text.trim(),
              'preferredLanguage': _language,
            })) {
          return;
        }
        break;
      case 1:
        if (_ethPhone.text.trim().isEmpty) {
          setState(() => _error = 'Ethiopian Telecom phone is required.');
          return;
        }
        if (!await _saveStep(repo, {
              'ethPhone': _ethPhone.text.trim(),
              'safaricomPhone': _safaricomPhone.text.trim(),
              'region': _region,
              'city': _city.text.trim(),
              'woreda': _woreda.text.trim(),
              'kebele': _kebele.text.trim(),
              'fullAddress': _fullAddress.text.trim(),
            })) {
          return;
        }
        break;
      case 2:
        if (_faydaFront == null || _faydaBack == null || _selfie == null || _passport == null) {
          setState(() => _error = 'All 4 identity documents are required.');
          return;
        }
        if (!await _saveStep(repo, {
              'faydaFront': _faydaFront,
              'faydaBack': _faydaBack,
              'selfieFayda': _selfie,
              'passportPhoto': _passport,
            })) {
          return;
        }
        break;
      case 3:
        if (_education.isEmpty) {
          setState(() => _error = 'Please select your highest education level.');
          return;
        }
        if (!await _saveStep(repo, {
              'highestEducation': _education,
              'educationCertificate': _eduCert,
            })) {
          return;
        }
        break;
      case 4:
        if (!await _saveStep(repo, {
              'agentExperience': _experience.text.trim(),
              'companyName': _company.text.trim(),
              'officeAddress': _officeAddr.text.trim(),
              'businessLicenseNumber': _licenseNum.text.trim(),
              'businessLicenseFile': _licenseFile,
              'tinNumber': _tin.text.trim(),
            })) {
          return;
        }
        break;
      case 5:
        if (!_agreedTerms || !_agreedPrivacy) {
          setState(() => _error = 'You must accept both the Terms & Conditions and Privacy Policy.');
          return;
        }
if (!await _saveStep(repo, {'onboardingComplete': true})) {
        return;
      }
      if (!mounted) return;
      // Refresh the cached session so the portal reflects the new
      // onboardingComplete / Pending status without a manual reload.
      await context.read<AuthProvider>().refreshUser();
      if (!mounted) return;
      _snack(t('application_submitted'));
      Navigator.of(context).pop();
      return;
    }

    if (!mounted) return;
    setState(() => _step = _step + 1);
  }

  Future<bool> _saveStep(AgentRepository repo, Map<String, dynamic> payload) async {
    setState(() => _saving = true);
    try {
      await repo.saveOnboarding(payload);
      return true;
    } on ApiException catch (e) {
      if (mounted) _snack(e.message);
    } catch (e) {
      if (mounted) _snack('An error occurred: $e');
    } finally {
      if (mounted) setState(() => _saving = false);
    }
    return false;
  }

  void _back() {
    setState(() {
      _error = null;
      _step = _step - 1;
    });
  }

  String? _getFile(String field) {
    switch (field) {
      case 'faydaFront':
        return _faydaFront;
      case 'faydaBack':
        return _faydaBack;
      case 'selfie':
        return _selfie;
      case 'passport':
        return _passport;
      case 'eduCert':
        return _eduCert;
      case 'license':
        return _licenseFile;
    }
    return null;
  }

  String _eduLabel(String value, String Function(String) t) {
    final map = {
      'Grade 10': 'edu_grade10',
      'Grade 12': 'edu_grade12',
      'TVET Certificate': 'edu_tvet',
      'Diploma': 'edu_diploma',
      "Bachelor's Degree": 'edu_bachelor',
      "Master's Degree": 'edu_master',
      'PhD': 'edu_phd',
    };
    return t(map[value] ?? value);
  }

  String _expLabel(String value, String Function(String) t) {
    final map = {
      'Less than 1 year': 'exp_less_1',
      '1–3 years': 'exp_1_3',
      '3–5 years': 'exp_3_5',
      '5–10 years': 'exp_5_10',
      'More than 10 years': 'exp_more_10',
    };
    return t(map[value] ?? value);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  Widget _labelledDropdown(String label, String value, List<(String, String)> options, ValueChanged<String> onChanged) {
    return Field(
      label: label,
      child: DropdownButtonFormField<String>(
        key: ValueKey('${label}_$value'),
        initialValue: value.isEmpty ? null : value,
        decoration: const InputDecoration(
          isDense: true,
          contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        ),
        hint: Text(label, style: const TextStyle(fontSize: 14, color: AppColors.mutedForeground)),
        items: options.map((o) => DropdownMenuItem(
          value: o.$1,
          child: Text(o.$2, style: const TextStyle(fontSize: 14, color: AppColors.foreground)),
        )).toList(),
        onChanged: (v) => onChanged(v ?? value),
      ),
    );
  }

  Widget _textField(TextEditingController controller, String label, {String? hint, bool required = false}) {
    return Field(
      label: required ? '$label *' : label,
      child: TextFormField(
        controller: controller,
        style: const TextStyle(fontSize: 14, color: AppColors.foreground),
        decoration: InputDecoration(
          hintText: hint,
          hintStyle: const TextStyle(fontSize: 14, color: AppColors.mutedForeground),
        ),
      ),
    );
  }

  Widget _uploadTile(String label, String field, {bool required = false}) {
    final t = context.read<LanguageProvider>().t;
    final value = _getFile(field);
    final uploading = _uploading == field;
    return Field(
      label: required ? '$label *' : label,
      child: value == null
          ? OutlinedButton.icon(
              onPressed: uploading ? null : () => _pickFile(field),
              icon: uploading
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.upload_file_outlined, size: 18),
              label: Text(uploading ? t('uploading') : t('click_to_upload')),
            )
          : ListTile(
              contentPadding: EdgeInsets.zero,
              dense: true,
              leading: const Icon(Icons.check_circle_outline, color: Colors.green, size: 20),
              title: Text(t('upload_success'), style: const TextStyle(fontSize: 14, color: AppColors.foreground)),
              trailing: IconButton(
                icon: const Icon(Icons.close, size: 18),
                onPressed: () => _clearFile(field),
              ),
            ),
    );
  }

  Widget _summaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: Text(label, style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground))),
          const SizedBox(width: 12),
          Expanded(
            flex: 2,
            child: Text(
              value,
              textAlign: TextAlign.right,
              style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.foreground),
            ),
          ),
        ],
      ),
    );
  }

  void _openTerms() {
    final t = context.read<LanguageProvider>().t;
    _showLegalModal(
      t('terms_conditions'),
      _userType == 'owner' ? t('terms_conditions_full') : t('terms_conditions_agent_full'),
    );
  }

  void _openPrivacy() {
    final t = context.read<LanguageProvider>().t;
    _showLegalModal(t('privacy_policy'), t('privacy_policy_full'));
  }

  void _showLegalModal(String title, String body) {
    showDialog<void>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(title, style: const TextStyle(fontSize: 17)),
        content: SizedBox(
          width: double.maxFinite,
          child: SingleChildScrollView(
            child: Text(body, style: const TextStyle(fontSize: 13, height: 1.5)),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text(context.read<LanguageProvider>().t('close')),
          ),
        ],
      ),
    );
  }

  // ── Step builders ──────────────────────────────────────────────────────────

  Widget _buildPersonal() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('personal_info'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _textField(_fullName, t('full_name'), hint: 'e.g. Abebe Girma', required: true),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: _labelledDropdown(
                  t('gender'),
                  _gender,
                  _genderOptions.map((g) => (g, t(g == 'Male' ? 'male' : g == 'Female' ? 'female' : 'other'))).toList(),
                  (v) => setState(() => _gender = v),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: _labelledDropdown(
                  t('user_type'),
                  _userType,
                  [('owner', t('owner_option')), ('agent', t('agent_option'))],
                  (v) => setState(() => _userType = v),
                ),
              ),
            ],
          ),
          Field(
            label: t('date_of_birth'),
            child: TextFormField(
              controller: _dob,
              readOnly: true,
              onTap: _pickDob,
              style: const TextStyle(fontSize: 14, color: AppColors.foreground),
              decoration: InputDecoration(
                hintText: 'YYYY-MM-DD',
                hintStyle: const TextStyle(fontSize: 14, color: AppColors.mutedForeground),
                suffixIcon: const Icon(Icons.calendar_today_outlined, size: 18),
              ),
            ),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_nationality, t('nationality'))),
              const SizedBox(width: 10),
              Expanded(
                child: _labelledDropdown(
                  t('preferred_language'),
                  _language,
                  _languageOptions.map((l) => (l, t(l == 'English' ? 'lang_english' : l == 'Afaan Oromo' ? 'lang_oromo' : 'lang_amharic'))).toList(),
                  (v) => setState(() => _language = v),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildContact() {
    final t = context.read<LanguageProvider>().t;
    final tv = context.read<LanguageProvider>().tv;
    return FormSection(
      title: t('contact_info'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_ethPhone, t('ethio_telecom_phone'), hint: '+251 9XX XXX XXX', required: true)),
              const SizedBox(width: 10),
              Expanded(child: _textField(_safaricomPhone, '${t('safaricom_phone')} (${t('optional')})', hint: '+251 7XX XXX XXX')),
            ],
          ),
          _labelledDropdown(
            t('region'),
            _region,
            _regions.map((r) => (r, tv(r))).toList(),
            (v) => setState(() => _region = v),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_city, t('city'), hint: 'City')),
              const SizedBox(width: 10),
              Expanded(child: _textField(_woreda, t('woreda_subcity'), hint: 'Woreda or Sub City')),
            ],
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_kebele, t('kebele'), hint: 'Kebele number')),
              const SizedBox(width: 10),
              Expanded(child: Container()),
            ],
          ),
          _textField(_fullAddress, t('full_address'), hint: 'Full mailing address'),
        ],
      ),
    );
  }

  Widget _buildIdentity() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('identity_verification'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFF0FDF4),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(t('identity_upload_note'), style: const TextStyle(fontSize: 12, color: Color(0xFF166534))),
          ),
          const SizedBox(height: 12),
          _uploadTile(t('fayda_front'), 'faydaFront', required: true),
          _uploadTile(t('fayda_back'), 'faydaBack', required: true),
          _uploadTile(t('selfie_fayda'), 'selfie', required: true),
          _uploadTile(t('passport_photo'), 'passport', required: true),
        ],
      ),
    );
  }

  Widget _buildEducation() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('education'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Field(
            label: '${t('highest_education')} *',
            child: DropdownButtonFormField<String>(
              key: ValueKey('edu_$_education'),
              initialValue: _education.isEmpty ? null : _education,
              decoration: const InputDecoration(
                isDense: true,
                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 10),
              ),
              hint: Text(t('select_education'), style: const TextStyle(fontSize: 14, color: AppColors.mutedForeground)),
              items: _educationOptions.map((e) => DropdownMenuItem(
                value: e,
                child: Text(_eduLabel(e, t), style: const TextStyle(fontSize: 14, color: AppColors.foreground)),
              )).toList(),
              onChanged: (v) => setState(() => _education = v ?? ''),
            ),
          ),
          _uploadTile('${t('upload_certificate')} (${t('optional')})', 'eduCert'),
        ],
      ),
    );
  }

  Widget _buildProfessional() {
    final t = context.read<LanguageProvider>().t;
    return FormSection(
      title: t('professional_info'),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: const Color(0xFFFFF7ED),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Text(t('professional_optional_note'), style: const TextStyle(fontSize: 12, color: Color(0xFF9A3412))),
          ),
          const SizedBox(height: 12),
          _labelledDropdown(
            t('agent_experience'),
            _experience.text,
            _experienceOptions.map((e) => (e, _expLabel(e, t))).toList(),
            (v) => setState(() => _experience.text = v),
          ),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_company, '${t('company_name')} (${t('optional')})')),
              const SizedBox(width: 10),
              Expanded(child: _textField(_tin, '${t('tin_number')} (${t('optional')})')),
            ],
          ),
          _textField(_officeAddr, '${t('office_address')} (${t('optional')})'),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _textField(_licenseNum, '${t('business_license_number')} (${t('optional')})')),
              const SizedBox(width: 10),
              Expanded(child: Container()),
            ],
          ),
          _uploadTile('${t('business_license_upload')} (${t('optional')})', 'license'),
        ],
      ),
    );
  }

  Widget _buildReview() {
    final t = context.read<LanguageProvider>().t;
    final tv = context.read<LanguageProvider>().tv;
    final isOwner = _userType == 'owner';
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        FormSection(
          title: t('review_submit'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _summaryRow(t('user_type'), isOwner ? t('owner_option') : t('agent_option')),
              _summaryRow(t('name_label'), _fullName.text.trim().isEmpty ? t('not_specified') : _fullName.text.trim()),
              _summaryRow(t('phone_label'), _ethPhone.text.trim().isEmpty ? t('not_specified') : _ethPhone.text.trim()),
              _summaryRow(t('region_label'), _region.isEmpty ? t('not_specified') : tv(_region)),
              _summaryRow(t('education_label'), _education.isEmpty ? t('not_specified') : _eduLabel(_education, t)),
              _summaryRow(t('experience_label'), _experience.text.trim().isEmpty ? t('not_specified') : _expLabel(_experience.text, t)),
            ],
          ),
        ),
        FormSection(
          title: t('terms_conditions'),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                value: _agreedTerms,
                onChanged: (v) => setState(() => _agreedTerms = v ?? false),
                title: Text(
                  '${t('agree_terms')} ${isOwner ? t('owner_terms_title') : t('agent_terms_title')} ${t('of_platform')}',
                  style: const TextStyle(fontSize: 13),
                ),
                secondary: TextButton(
                  onPressed: _openTerms,
                  child: const Icon(Icons.open_in_new, size: 18),
                ),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                dense: true,
                value: _agreedPrivacy,
                onChanged: (v) => setState(() => _agreedPrivacy = v ?? false),
                title: Text(
                  '${t('agree_terms')} ${t('privacy_policy')} ${t('agree_privacy')}',
                  style: const TextStyle(fontSize: 13),
                ),
                secondary: TextButton(
                  onPressed: _openPrivacy,
                  child: const Icon(Icons.open_in_new, size: 18),
                ),
              ),
            ],
          ),
        ),
        FormSection(
          title: t('after_submission'),
          child: Text(
            '${t('after_submission_note')} ${t('pending_approval')} ${t('after_submission_note2')}',
            style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
          ),
        ),
      ],
    );
  }

  Widget _stepper() {
    final t = context.read<LanguageProvider>().t;
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: List.generate(_stepLabels.length, (i) {
          final done = i < _step;
          final active = i == _step;
          return Expanded(
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Container(
                        width: 28,
                        height: 28,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: active ? AppColors.primary : (done ? Colors.green : Colors.white),
                          border: Border.all(
                            color: active || done ? Colors.transparent : AppColors.border,
                            width: 2,
                          ),
                        ),
                        child: Center(
                          child: done
                              ? const Icon(Icons.check, size: 16, color: Colors.white)
                              : Text(
                                  '${i + 1}',
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: active ? Colors.white : AppColors.mutedForeground,
                                  ),
                                ),
                        ),
                      ),
                      const SizedBox(height: 4),
                      SizedBox(
                        height: 24,
                        child: Text(
                          t(_stepLabels[i]),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: TextStyle(
                            fontSize: 9,
                            fontWeight: active ? FontWeight.bold : FontWeight.normal,
                            color: active ? AppColors.primary : AppColors.mutedForeground,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
                if (i < _stepLabels.length - 1)
                  Container(height: 2, width: 8, color: done ? Colors.green : AppColors.border),
              ],
            ),
          );
        }),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;
    final isLast = _step == _stepLabels.length - 1;
    return Scaffold(
      appBar: AppBar(title: Text(t('complete_profile'))),
      resizeToAvoidBottomInset: true,
      body: SafeArea(
        child: Column(
          children: [
            _stepper(),
            if (_error != null)
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                decoration: BoxDecoration(
                  color: AppColors.destructive.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.error_outline, size: 18, color: AppColors.destructive),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(_error!, style: const TextStyle(fontSize: 12, color: AppColors.destructive)),
                    ),
                  ],
                ),
              ),
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    switch (_step) {
                      0 => _buildPersonal(),
                      1 => _buildContact(),
                      2 => _buildIdentity(),
                      3 => _buildEducation(),
                      4 => _buildProfessional(),
                      _ => _buildReview(),
                    },
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        OutlinedButton.icon(
                          onPressed: _step == 0 || _saving ? null : _back,
                          icon: const Icon(Icons.arrow_back, size: 18),
                          label: Text(t('back')),
                        ),
                        const Spacer(),
                        if (!isLast)
                          FilledButton.icon(
                            onPressed: _saving ? null : _next,
                            icon: const Icon(Icons.arrow_forward, size: 18),
                            label: Text(t('save_continue')),
                          )
                        else
                          FilledButton.icon(
                            onPressed: _saving ? null : _next,
                            icon: _saving
                                ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                                : const Icon(Icons.send, size: 18),
                            label: Text(_saving ? t('saving') : t('submit_application')),
                          ),
                      ],
                    ),
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

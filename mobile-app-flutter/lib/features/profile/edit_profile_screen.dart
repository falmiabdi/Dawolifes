import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../providers/auth_provider.dart';
import '../../providers/language_provider.dart';
import '../agent/post_form_widgets.dart';

/// Edit profile screen mirroring the web app's profile-photo uploader +
/// `PATCH /api/auth/profile`. Lets the user update their name, phone and
/// profile photo (uploaded via `/api/agent/upload` then saved to the session).
class EditProfileScreen extends StatefulWidget {
  const EditProfileScreen({super.key});

  @override
  State<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends State<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _name;
  late final TextEditingController _phone;
  bool _uploading = false;
  bool _submitting = false;
  String? _error;
  String? _photoUrl;

  @override
  void initState() {
    super.initState();
    final user = context.read<AuthProvider>().user;
    _name = TextEditingController(text: user?.name ?? '');
    _phone = TextEditingController(text: user?.phone ?? '');
    _photoUrl = user?.profilePhoto;
  }

  @override
  void dispose() {
    _name.dispose();
    _phone.dispose();
    super.dispose();
  }

  Future<void> _pickPhoto() async {
    setState(() => _uploading = true);
    try {
      final api = context.read<ApiClient>();
      final url = await pickAndUploadImage(api, endpoint: '/api/agent/upload', field: 'image');
      if (!mounted) return;
      setState(() => _photoUrl = url);
    } on ImagePickCancelled {
      // user backed out
    } on ApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Photo upload failed: ${e.message}')));
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Photo upload failed: $e')));
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() {
      _submitting = true;
      _error = null;
    });

    try {
      await context.read<AuthProvider>().updateProfile(
            name: _name.text,
            phone: _phone.text.trim().isEmpty ? null : _phone.text.trim(),
            profilePhoto: _photoUrl,
          );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(context.read<LanguageProvider>().t('profile_updated'))),
      );
      Navigator.of(context).pop(true);
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() => _error = e.message);
    } catch (e) {
      if (!mounted) return;
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final t = context.read<LanguageProvider>().t;
    final user = context.watch<AuthProvider>().user;
    final email = user?.email ?? '';

    return Scaffold(
      appBar: AppBar(title: Text(t('edit_profile'))),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Center(
              child: Stack(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: AppColors.primary,
                    backgroundImage: _photoUrl != null ? CachedNetworkImageProvider(_photoUrl!) : null,
                    child: _photoUrl != null
                        ? null
                        : Text(
                            _name.text.isNotEmpty ? _name.text[0].toUpperCase() : '?',
                            style: const TextStyle(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                          ),
                  ),
                  Positioned(
                    bottom: 0,
                    right: 0,
                    child: InkWell(
                      onTap: _uploading ? null : _pickPhoto,
                      borderRadius: BorderRadius.circular(20),
                      child: Container(
                        width: 40,
                        height: 40,
                        decoration: const BoxDecoration(
                          color: AppColors.primary,
                          shape: BoxShape.circle,
                        ),
                        child: _uploading
                            ? const Padding(
                                padding: EdgeInsets.all(10),
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Icon(Icons.camera_alt, color: Colors.white, size: 20),
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 8),
            Center(
              child: TextButton.icon(
                onPressed: _uploading ? null : _pickPhoto,
                icon: const Icon(Icons.photo_library_outlined, size: 16),
                label: Text(_uploading ? t('uploading_photo') : t('change_photo')),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              t('full_name'),
              style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _name,
              validator: (v) => (v == null || v.trim().length < 2) ? 'Name must be at least 2 characters' : null,
              decoration: const InputDecoration(hintText: 'Full Name'),
            ),
            const SizedBox(height: 16),
            Text(
              t('email'),
              style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
            ),
            const SizedBox(height: 6),
            TextFormField(
              initialValue: email,
              readOnly: true,
              enabled: false,
              decoration: InputDecoration(
                hintText: email,
                disabledBorder: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: const BorderSide(color: AppColors.border),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              t('phone_number_label'),
              style: const TextStyle(color: Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 14),
            ),
            const SizedBox(height: 6),
            TextFormField(
              controller: _phone,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(hintText: '+251 911 000 000'),
            ),
            if (_error != null) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Text(_error!, style: const TextStyle(color: Color(0xFFDC2626), fontSize: 14)),
              ),
            ],
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: _submitting ? null : _save,
              icon: _submitting
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.save_outlined, size: 18),
              label: Text(_submitting ? t('saving') : t('save_profile')),
            ),
            const SizedBox(height: 32),
          ],
        ),
      ),
    );
  }
}

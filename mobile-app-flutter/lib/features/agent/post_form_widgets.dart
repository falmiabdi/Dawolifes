import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';

/// Section card used inside the post forms.
class FormSection extends StatelessWidget {
  const FormSection({super.key, required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      color: Colors.white,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppColors.radius),
        side: const BorderSide(color: AppColors.border, width: 1.5),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.foreground),
            ),
            const SizedBox(height: 16),
            child,
          ],
        ),
      ),
    );
  }
}

/// Horizontal label + control row used by the post forms.
class Field extends StatelessWidget {
  const Field({super.key, required this.label, required this.child, this.expanded = true});

  final String label;
  final Widget child;
  final bool expanded;

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            label,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: AppColors.foreground),
          ),
          const SizedBox(height: 6),
          SizedBox(width: expanded ? double.infinity : null, child: child),
        ],
      ),
    );
  }
}

/// Picks a single image from the gallery and uploads it, returning the URL.
///
/// Agent screens use [endpoint] `/api/agent/upload` (matching the web app's
/// agent post flow); the public post wizard uses `/api/upload`. The filename
/// is normalized to carry the correct extension so the server's multer
/// fileFilter (which checks both extension and mimetype) accepts the upload.
Future<String> pickAndUploadImage(ApiClient api, {String endpoint = '/api/agent/upload', String field = 'image'}) async {
  final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 75, maxWidth: 1600);
  if (file == null) throw ImagePickCancelled();
  final bytes = await file.readAsBytes();
  final mime = file.mimeType?.isNotEmpty == true
      ? file.mimeType!
      : _mimeFromExtension(file.name);
  final safeName = _ensureExtension(file.name, mime);
  final data = await api.uploadFile(
    endpoint,
    bytes: bytes,
    filename: safeName,
    contentType: mime,
    fields: field.isNotEmpty ? {'field': field} : const {},
  ) as Map<String, dynamic>;
  final url = data['url'];
  if (url == null) throw ApiException('Upload failed');
  return '$url';
}

/// Picks a location document (image, JPG/PNG) and uploads it, returning the URL.
Future<String> pickAndUploadDocument(ApiClient api) async {
  final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 2000);
  if (file == null) throw ImagePickCancelled();
  final bytes = await file.readAsBytes();
  final mime = file.mimeType?.isNotEmpty == true ? file.mimeType! : _mimeFromExtension(file.name);
  final safeName = _ensureExtension(file.name, mime);
  final data = await api.uploadFile(
    '/api/agent/upload',
    bytes: bytes,
    filename: safeName,
    contentType: mime,
    fields: const {'field': 'document'},
  ) as Map<String, dynamic>;
  final url = data['url'];
  if (url == null) throw ApiException('Upload failed');
  return '$url';
}

/// Guarantees [name] ends with an extension matching [mime] so multer's
/// fileFilter (which tests both extension and mimetype) doesn't reject it.
String _ensureExtension(String name, String mime) {
  final ext = _extensionFromMime(mime);
  if (name.toLowerCase().endsWith('.$ext')) return name;
  if (name.contains('.')) return name; // keep existing extension if present
  return '$name.$ext';
}

String _extensionFromMime(String mime) {
  return switch (mime) {
    'image/png' => 'png',
    'image/gif' => 'gif',
    'image/webp' => 'webp',
    'application/pdf' => 'pdf',
    _ => 'jpg',
  };
}

String _mimeFromExtension(String name) {
  final ext = name.split('.').last.toLowerCase();
  return switch (ext) {
    'png' => 'image/png',
    'gif' => 'image/gif',
    'webp' => 'image/webp',
    'mp4' => 'video/mp4',
    'mov' => 'video/quicktime',
    'pdf' => 'application/pdf',
    'doc' => 'application/msword',
    'docx' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    _ => 'image/jpeg',
  };
}

/// Thrown when the user cancels the gallery picker.
class ImagePickCancelled implements Exception {}

/// Grid of uploaded images with add/remove controls.
class ImageGridPicker extends StatelessWidget {
  const ImageGridPicker({
    super.key,
    required this.images,
    required this.onChanged,
    required this.onPick,
    this.uploading = false,
    this.hint = 'Upload at least 3 photos',
  });

  final List<String> images;
  final ValueChanged<List<String>> onChanged;
  final Future<void> Function() onPick;
  final bool uploading;
  final String hint;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (hint.isNotEmpty) ...[
          Text(hint, style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground)),
          const SizedBox(height: 8),
        ],
        GridView.count(
          crossAxisCount: 3,
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          mainAxisSpacing: 8,
          crossAxisSpacing: 8,
          children: [
            ...images.map((url) => Stack(
                  fit: StackFit.expand,
                  children: [
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: CachedNetworkImage(imageUrl: url, fit: BoxFit.cover),
                    ),
                    Positioned(
                      top: 2,
                      right: 2,
                      child: GestureDetector(
                        onTap: () => onChanged(images.where((e) => e != url).toList()),
                        child: Container(
                          padding: const EdgeInsets.all(3),
                          decoration: const BoxDecoration(color: Colors.black54, shape: BoxShape.circle),
                          child: const Icon(Icons.close, color: Colors.white, size: 14),
                        ),
                      ),
                    ),
                  ],
                )),
            InkWell(
              onTap: uploading ? null : onPick,
              borderRadius: BorderRadius.circular(8),
              child: Container(
                decoration: BoxDecoration(
                  color: AppColors.muted,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: AppColors.border, style: BorderStyle.solid),
                ),
                child: uploading
                    ? const Center(
                        child: SizedBox(width: 22, height: 22, child: CircularProgressIndicator(strokeWidth: 2)),
                      )
                    : const Center(child: Icon(Icons.add_a_photo_outlined, color: AppColors.mutedForeground)),
              ),
            ),
          ],
        ),
      ],
    );
  }
}

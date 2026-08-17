import 'package:cached_network_image/cached_network_image.dart';
import 'package:file_picker/file_picker.dart';
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
    return Container(
      padding: const EdgeInsets.all(14),
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(AppColors.radius),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold, color: AppColors.foreground)),
          const SizedBox(height: 12),
          child,
        ],
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
      padding: const EdgeInsets.symmetric(vertical: 5),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.foreground)),
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

/// Picks a location document (image or PDF) and uploads it, returning the URL.
///
/// Presents a source picker so users can attach either a JPG/PNG photo or a
/// PDF file, mirroring the web app's document upload (which accepts PDF/JPG/PNG).
Future<String> pickAndUploadDocument(BuildContext context, ApiClient api) async {
  final kind = await showModalBottomSheet<_DocKind>(
    context: context,
    builder: (ctx) => SafeArea(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          ListTile(
            leading: const Icon(Icons.image_outlined),
            title: const Text('Image (JPG/PNG)', style: TextStyle(fontSize: 14)),
            subtitle: const Text('Photo of the document', style: TextStyle(fontSize: 12)),
            onTap: () => Navigator.of(ctx).pop(_DocKind.image),
          ),
          ListTile(
            leading: const Icon(Icons.picture_as_pdf_outlined),
            title: const Text('PDF document', style: TextStyle(fontSize: 14)),
            subtitle: const Text('Upload a scanned PDF', style: TextStyle(fontSize: 12)),
            onTap: () => Navigator.of(ctx).pop(_DocKind.pdf),
          ),
        ],
      ),
    ),
  );
  if (kind == null) throw ImagePickCancelled();

  if (kind == _DocKind.image) {
    final file = await ImagePicker().pickImage(source: ImageSource.gallery, imageQuality: 80, maxWidth: 2000);
    if (file == null) throw ImagePickCancelled();
    final bytes = await file.readAsBytes();
    final mime = file.mimeType?.isNotEmpty == true ? file.mimeType! : _mimeFromExtension(file.name);
    return _uploadDocument(api, bytes, _ensureExtension(file.name, mime), mime);
  }

  final picked = await FilePicker.pickFile(
    type: FileType.custom,
    allowedExtensions: ['pdf'],
  );
  if (picked == null) throw ImagePickCancelled();
  final bytes = await picked.readAsBytes();
  final name = picked.name.toLowerCase().endsWith('.pdf') ? picked.name : '${picked.name}.pdf';
  return _uploadDocument(api, bytes, name, 'application/pdf');
}

enum _DocKind { image, pdf }

Future<String> _uploadDocument(ApiClient api, List<int> bytes, String filename, String mime) async {
  final data = await api.uploadFile(
    '/api/agent/upload',
    bytes: bytes,
    filename: filename,
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

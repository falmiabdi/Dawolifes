import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/review.dart';
import '../../data/repositories/review_repository.dart';
import '../../providers/auth_provider.dart';
import '../auth/login_screen.dart';





class AgentRatingButton extends StatefulWidget {
  const AgentRatingButton({super.key, required this.agentId, required this.agentName});

  final String agentId;
  final String agentName;

  @override
  State<AgentRatingButton> createState() => _AgentRatingButtonState();
}

class _AgentRatingButtonState extends State<AgentRatingButton> {
  AgentReviews? _data;
  bool _loading = true;

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ReviewRepository>().fetchAgentReviews(widget.agentId);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
      });
    } catch (_) {
      
      if (!mounted) return;
      setState(() => _loading = false);
    }
  }

  void _open() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => AgentReviewsSheet(agentId: widget.agentId, agentName: widget.agentName),
    ).then((_) => _load());
  }

  @override
  Widget build(BuildContext context) {
    final data = _data;
    final average = data?.average ?? 0;
    final count = data?.count ?? 0;

    return OutlinedButton(
      onPressed: _open,
      style: OutlinedButton.styleFrom(
        minimumSize: const Size.fromHeight(44),
        side: const BorderSide(color: AppColors.border),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        foregroundColor: AppColors.foreground,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _RatingStars(size: 16, filled: average.round()),
          const SizedBox(width: 6),
          Text(
            average == 0 ? 'New' : average.toStringAsFixed(1),
            style: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.foreground),
          ),
          Text(' ($count)', style: const TextStyle(color: AppColors.mutedForeground)),
          const SizedBox(width: 6),
          const Text('Reviews', style: TextStyle(color: AppColors.primary)),
          if (_loading)
            const Padding(
              padding: EdgeInsets.only(left: 6),
              child: SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.mutedForeground),
              ),
            ),
        ],
      ),
    );
  }
}


class _RatingStars extends StatelessWidget {
  const _RatingStars({required this.size, required this.filled});

  final double size;
  final int filled;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (i) {
        final active = i < filled;
        return Icon(
          Icons.star,
          size: size,
          color: active ? const Color(0xFFFBBF24) : AppColors.muted,
        );
      }),
    );
  }
}



class AgentReviewsSheet extends StatefulWidget {
  const AgentReviewsSheet({super.key, required this.agentId, required this.agentName});

  final String agentId;
  final String agentName;

  @override
  State<AgentReviewsSheet> createState() => _AgentReviewsSheetState();
}

class _AgentReviewsSheetState extends State<AgentReviewsSheet> {
  AgentReviews? _data;
  bool _loading = true;
  String? _loadError;

  int _rating = 5;
  int _hover = 0;
  final _comment = TextEditingController();
  bool _saving = false;
  String? _submitMessage;
  bool _submitError = false;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _comment.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    try {
      final data = await context.read<ReviewRepository>().fetchAgentReviews(widget.agentId);
      if (!mounted) return;
      setState(() {
        _data = data;
        _loading = false;
        _loadError = null;
      });
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = e.message;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _loading = false;
        _loadError = 'Failed to load reviews.';
      });
    }
  }

  Future<void> _submit() async {
    setState(() {
      _saving = true;
      _submitMessage = null;
      _submitError = false;
    });
    try {
      await context.read<ReviewRepository>().submitReview(
            agentId: widget.agentId,
            rating: _rating,
            comment: _comment.text,
          );
      if (!mounted) return;
      setState(() {
        _saving = false;
        _submitMessage = 'Review saved';
      });
      await _load();
      if (!mounted) return;
      Navigator.of(context).pop();
    } on ApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _submitMessage = e.message;
        _submitError = true;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _saving = false;
        _submitMessage = 'Failed to save rating';
        _submitError = true;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final userId = auth.user?.id;
    final isOwn = userId != null && userId == widget.agentId;

    return SafeArea(
      child: SizedBox(
        height: MediaQuery.of(context).size.height * 0.85,
        child: Column(
          children: [
            const SizedBox(height: 8),
            Container(
              width: 36,
              height: 4,
              decoration: BoxDecoration(color: AppColors.muted, borderRadius: BorderRadius.circular(2)),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Ratings for ${widget.agentName}',
                      style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: AppColors.foreground),
                    ),
                  ),
                  IconButton(
                    onPressed: () => Navigator.of(context).pop(),
                    icon: const Icon(Icons.close, color: AppColors.mutedForeground),
                  ),
                ],
              ),
            ),
            const Divider(height: 1, color: Color(0xFFE2E8F0)),
            Expanded(
              child: _loading
                  ? const Center(
                      child: CircularProgressIndicator(color: AppColors.primary),
                    )
                  : _loadError != null
                      ? Center(child: Text(_loadError!, style: const TextStyle(color: AppColors.destructive)))
                      : ListView(
                          padding: const EdgeInsets.all(16),
                          children: [
                            _summary(auth.isLoggedIn, isOwn),
                            if (auth.isLoggedIn && !isOwn) ...[
                              const SizedBox(height: 16),
                              _RateForm(
                                rating: _rating,
                                hover: _hover,
                                comment: _comment,
                                saving: _saving,
                                error: _submitMessage,
                                isError: _submitError,
                                onHover: (i) => setState(() => _hover = i),
                                onSelect: (i) => setState(() => _rating = i),
                                onSubmit: _submit,
                              ),
                            ],
                            const SizedBox(height: 20),
                            _ReviewList(reviews: _data?.reviews ?? const []),
                          ],
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _summary(bool loggedIn, bool isOwn) {
    final average = _data?.average ?? 0;
    final count = _data?.count ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            children: [
              _RatingStars(size: 20, filled: average.round()),
              const SizedBox(width: 12),
              Text(
                average > 0 ? average.toStringAsFixed(1) : 'No ratings yet',
                style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w700, color: AppColors.foreground),
              ),
              const SizedBox(width: 8),
              Text(
                '$count review${count == 1 ? '' : 's'}',
                style: const TextStyle(fontSize: 12, color: AppColors.mutedForeground),
              ),
            ],
          ),
        ),
        if (!loggedIn) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              border: Border.all(color: AppColors.muted, width: 1, style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              children: [
                const Icon(Icons.login_outlined, size: 28, color: AppColors.mutedForeground),
                const SizedBox(height: 8),
                Text(
                  'Sign in to rate ${widget.agentName}.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 13, color: AppColors.mutedForeground),
                ),
                const SizedBox(height: 12),
                FilledButton(
                  onPressed: () {
                    Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => const LoginScreen()),
                    );
                  },
                  style: FilledButton.styleFrom(
                    minimumSize: const Size.fromHeight(44),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                  child: const Text('Sign in'),
                ),
              ],
            ),
          ),
        ],
        if (loggedIn && isOwn) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(12),
            ),
            child: const Text(
              'You cannot rate your own listings.',
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 13, color: AppColors.mutedForeground),
            ),
          ),
        ],
      ],
    );
  }
}

class _RateForm extends StatelessWidget {
  const _RateForm({
    required this.rating,
    required this.hover,
    required this.comment,
    required this.saving,
    required this.error,
    required this.isError,
    required this.onHover,
    required this.onSelect,
    required this.onSubmit,
  });

  final int rating;
  final int hover;
  final TextEditingController comment;
  final bool saving;
  final String? error;
  final bool isError;
  final ValueChanged<int> onHover;
  final ValueChanged<int> onSelect;
  final VoidCallback onSubmit;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.muted),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Rate this agent',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.foreground),
          ),
          const SizedBox(height: 2),
          const Text(
            'Ratings are only allowed after a conversation — a 5-star rating is reserved for service you were actually given.',
            style: TextStyle(fontSize: 12, color: AppColors.mutedForeground),
          ),
          const SizedBox(height: 8),
          Wrap(
            crossAxisAlignment: WrapCrossAlignment.center,
            children: [
              Row(
                mainAxisSize: MainAxisSize.min,
                children: List.generate(5, (i) {
                  final active = i < (hover > 0 ? hover : rating);
                  return InkWell(
                    onTap: () => onSelect(i + 1),
                    onHover: (h) => onHover(h ? i + 1 : 0),
                    borderRadius: BorderRadius.circular(8),
                    child: Padding(
                      padding: const EdgeInsets.all(4),
                      child: Icon(
                        Icons.star,
                        size: 30,
                        color: active ? const Color(0xFFFBBF24) : AppColors.muted,
                      ),
                    ),
                  );
                }),
              ),
              const SizedBox(width: 8),
              Text(
                '$rating.0',
                style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.foreground),
              ),
            ],
          ),
          const SizedBox(height: 8),
          TextField(
            controller: comment,
            maxLength: 1000,
            maxLines: 3,
            decoration: const InputDecoration(
              hintText: 'Share your experience (optional)',
              border: OutlineInputBorder(borderRadius: BorderRadius.all(Radius.circular(12))),
            ),
          ),
          if (error != null)
            Padding(
              padding: const EdgeInsets.only(top: 8),
              child: Text(
                error!,
                style: TextStyle(fontSize: 12, color: isError ? const Color(0xFFDC2626) : const Color(0xFF15803D)),
              ),
            ),
          const SizedBox(height: 12),
          FilledButton(
            onPressed: saving ? null : onSubmit,
            style: FilledButton.styleFrom(
              minimumSize: const Size.fromHeight(44),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: saving
                ? const SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                  )
                : const Text('Submit rating'),
          ),
        ],
      ),
    );
  }
}

class _ReviewList extends StatelessWidget {
  const _ReviewList({required this.reviews});

  final List<AgentReview> reviews;

  @override
  Widget build(BuildContext context) {
    if (reviews.isEmpty) {
      return Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: AppColors.muted, style: BorderStyle.solid),
          borderRadius: BorderRadius.circular(12),
        ),
        child: const Column(
          children: [
            Icon(Icons.chat_bubble_outline, size: 24, color: AppColors.mutedForeground),
            SizedBox(height: 6),
            Text('No reviews yet.', style: TextStyle(color: AppColors.mutedForeground, fontSize: 13)),
          ],
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Reviews',
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, letterSpacing: 0.4, color: AppColors.mutedForeground),
        ),
        const SizedBox(height: 8),
        ...reviews.map((r) => _ReviewTile(review: r)),
      ],
    );
  }
}

class _ReviewTile extends StatelessWidget {
  const _ReviewTile({required this.review});

  final AgentReview review;

  @override
  Widget build(BuildContext context) {
    final initial = review.reviewerName.isNotEmpty ? review.reviewerName.trim()[0].toUpperCase() : '?';
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        border: Border.all(color: AppColors.muted),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              CircleAvatar(
                radius: 16,
                backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                backgroundImage: review.reviewerPhoto != null && review.reviewerPhoto!.isNotEmpty
                    ? CachedNetworkImageProvider(Formatters.imageUrl(review.reviewerPhoto!))
                    : null,
                child: Text(
                  initial,
                  style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppColors.primary),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      review.reviewerName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: AppColors.foreground),
                    ),
                    const SizedBox(height: 2),
                    _RatingStars(size: 12, filled: review.rating),
                  ],
                ),
              ),
              const SizedBox(width: 8),
              Text(
                _timeAgo(review.createdAt),
                style: const TextStyle(fontSize: 11, color: AppColors.mutedForeground),
              ),
            ],
          ),
          if (review.comment != null && review.comment!.trim().isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(
              review.comment!,
              style: const TextStyle(fontSize: 13, height: 1.4),
            ),
          ],
        ],
      ),
    );
  }

  String _timeAgo(DateTime time) {
    final diff = DateTime.now().difference(time);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inHours < 1) return '${diff.inMinutes}m';
    if (diff.inDays < 1) return '${diff.inHours}h';
    return '${diff.inDays}d';
  }
}
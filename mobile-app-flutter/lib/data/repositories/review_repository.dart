import '../../core/network/api_client.dart';
import '../models/review.dart';

/// Reviews API calls, mirroring web's agent-rating.tsx.
///
/// Submitting a review requires prior contact with the agent: the server only
/// accepts a rating when a message has been exchanged between the reviewer and
/// the agent on some listing (403 otherwise). Reviewing yourself is rejected.
class ReviewRepository {
  ReviewRepository(this._api);

  final ApiClient _api;

  /// Pulls an agent's aggregate rating + review list. Public endpoint, so it
  /// works while signed out too (matches the web badge).
  Future<AgentReviews> fetchAgentReviews(String agentId) async {
    final data = await _api.get('/api/reviews/agent/$agentId') as Map<String, dynamic>;
    return AgentReviews.fromJson(data);
  }

  /// Creates or updates a review; the server enforces the conversation gate.
  Future<void> submitReview({
    required String agentId,
    required int rating,
    String? comment,
  }) async {
    await _api.post('/api/reviews', {
      'agentId': agentId,
      'rating': rating,
      if (comment != null && comment.trim().isNotEmpty) 'comment': comment.trim(),
    });
  }
}
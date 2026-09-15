import '../../core/network/api_client.dart';
import '../models/review.dart';






class ReviewRepository {
  ReviewRepository(this._api);

  final ApiClient _api;

  
  
  Future<AgentReviews> fetchAgentReviews(String agentId) async {
    final data = await _api.get('/api/reviews/agent/$agentId') as Map<String, dynamic>;
    return AgentReviews.fromJson(data);
  }

  
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
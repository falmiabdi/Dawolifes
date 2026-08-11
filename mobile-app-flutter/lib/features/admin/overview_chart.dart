import 'package:fl_chart/fl_chart.dart';
import 'package:flutter/material.dart';

import '../../core/theme/app_colors.dart';

/// Growth & revenue analytics area chart mirroring the web app's
/// `OverviewChart` (recharts AreaChart) on the admin dashboard.
class OverviewChart extends StatelessWidget {
  const OverviewChart({super.key, this.height = 320});

  final double height;

  static const _listings = [12.0, 18.0, 26.0, 32.0, 45.0, 60.0, 82.0];
  static const _revenue = [2000.0, 3500.0, 5000.0, 7200.0, 11000.0, 15000.0, 19500.0];

  @override
  Widget build(BuildContext context) {
    final spots = List.generate(_listings.length, (i) => FlSpot(i.toDouble(), _listings[i]));
    final revenueSpots = List.generate(_revenue.length, (i) => FlSpot(i.toDouble(), _revenue[i]));
    final maxY = _revenue.reduce((a, b) => a > b ? a : b).roundToDouble();

    return SizedBox(
      height: height,
      width: double.infinity,
      child: LineChart(
        LineChartData(
          minY: 0,
          maxY: maxY,
          gridData: FlGridData(
            show: true,
            drawVerticalLine: false,
            getDrawingHorizontalLine: (value) => FlLine(
              color: const Color(0xFFF1F5F9),
              strokeWidth: 1,
              dashArray: [4, 4],
            ),
          ),
          titlesData: FlTitlesData(
            topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            rightTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            bottomTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 24,
                interval: 1,
                getTitlesWidget: (value, meta) {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'];
                  final idx = value.toInt();
                  if (idx < 0 || idx >= months.length) return const SizedBox.shrink();
                  return Text(
                    months[idx],
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  );
                },
              ),
            ),
            leftTitles: AxisTitles(
              sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 44,
                interval: 5000,
                getTitlesWidget: (value, meta) {
                  if (value == 0) return const SizedBox.shrink();
                  return Text(
                    '${value.toInt() / 1000}k',
                    style: const TextStyle(fontSize: 11, color: Color(0xFF94A3B8)),
                  );
                },
              ),
            ),
          ),
          borderData: FlBorderData(show: false),
          lineTouchData: LineTouchData(
            touchTooltipData: LineTouchTooltipData(
              getTooltipColor: (_) => Colors.white,
              getTooltipItems: (touchedSpots) {
                return touchedSpots.map((spot) {
                  final isRevenue = spot.y > 500;
                  final month = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul'][spot.x.toInt().clamp(0, 6)];
                  final label = isRevenue
                      ? 'Revenue · ETB ${spot.y.toInt()}'
                      : 'Listings · ${spot.y.toInt()}';
                  return LineTooltipItem(
                    '$month\n$label',
                    TextStyle(
                      fontSize: 12,
                      color: isRevenue ? const Color(0xFF0F172A) : AppColors.primary,
                      fontWeight: FontWeight.w600,
                    ),
                  );
                }).toList();
              },
            ),
          ),
          lineBarsData: [
            LineChartBarData(
              spots: spots,
              isCurved: true,
              curveSmoothness: 0.35,
              barWidth: 2.5,
              color: AppColors.primary,
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    AppColors.primary.withValues(alpha: 0.2),
                    AppColors.primary.withValues(alpha: 0.0),
                  ],
                ),
              ),
            ),
            LineChartBarData(
              spots: revenueSpots,
              isCurved: true,
              curveSmoothness: 0.35,
              barWidth: 2,
              color: const Color(0xFF0F172A),
              dotData: const FlDotData(show: false),
              belowBarData: BarAreaData(
                show: true,
                gradient: LinearGradient(
                  begin: Alignment.topCenter,
                  end: Alignment.bottomCenter,
                  colors: [
                    const Color(0xFF0F172A).withValues(alpha: 0.1),
                    const Color(0xFF0F172A).withValues(alpha: 0.0),
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

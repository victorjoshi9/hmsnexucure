import 'package:flutter/material.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import '../../../core/constants/app_colors.dart';

class HistoryScreen extends StatefulWidget {
  const HistoryScreen({super.key});

  @override
  State<HistoryScreen> createState() => _HistoryScreenState();
}

class _HistoryScreenState extends State<HistoryScreen> {
  bool _isLoading = true;
  List<dynamic> _history = [];
  double _hourlyRate = 0.0;

  @override
  void initState() {
    super.initState();
    _fetchHistory();
  }

  Future<void> _fetchHistory() async {
    try {
      final user = Supabase.instance.client.auth.currentUser;
      if (user == null) {
        setState(() => _isLoading = false);
        return;
      }

      // 1. Fetch Employee Profile (for hourly rate)
      final empResponse = await Supabase.instance.client
          .from('employees')
          .select('hourly_rate')
          .eq('firebase_uid', user.id)
          .maybeSingle();

      if (empResponse != null) {
        _hourlyRate = (empResponse['hourly_rate'] as num?)?.toDouble() ?? 0.0;
      }

      // 2. Fetch Attendance History
      final data = await Supabase.instance.client
          .from('attendance')
          .select('*')
          // RLS ensures they only see their own attendance
          .order('date', ascending: false)
          .limit(30);

      setState(() {
        _history = data as List<dynamic>;
        _isLoading = false;
      });
    } catch (e) {
      debugPrint("Error fetching history: $e");
      setState(() => _isLoading = false);
    }
  }

  String _formatTime(String? isoString) {
    if (isoString == null) return '--:--';
    final dt = DateTime.parse(isoString).toLocal();
    return "${dt.hour.toString().padLeft(2, '0')}:${dt.minute.toString().padLeft(2, '0')}";
  }

  Future<void> _generateAndPrintPdf() async {
    final pdf = pw.Document();

    // Compute totals
    int totalWorkMinutes = 0;
    for (var record in _history) {
      totalWorkMinutes += (record['total_work_minutes'] as num?)?.toInt() ?? 0;
    }
    double totalHours = totalWorkMinutes / 60.0;
    double estimatedSalary = totalHours * _hourlyRate;

    pdf.addPage(
      pw.Page(
        pageFormat: PdfPageFormat.a4,
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Text('Attendance & Salary Report', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
              pw.SizedBox(height: 10),
              pw.Text('Date Generated: ${DateTime.now().toLocal().toString().split(' ')[0]}'),
              pw.SizedBox(height: 20),

              // Summary
              pw.Container(
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(color: PdfColors.grey200, borderRadius: const pw.BorderRadius.all(pw.Radius.circular(8))),
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Text('Total Hours: ${totalHours.toStringAsFixed(1)} hrs', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                    pw.Text('Hourly Rate: Rs $_hourlyRate/hr'),
                    pw.Text('Est. Salary: Rs ${estimatedSalary.toStringAsFixed(2)}', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.green800)),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),

              // Table
              pw.Table.fromTextArray(
                headers: ['Date', 'Check In', 'Check Out', 'Status', 'Work Hrs', 'Est. Pay'],
                data: _history.map((r) {
                  double hrs = ((r['total_work_minutes'] as num?)?.toDouble() ?? 0) / 60.0;
                  return [
                    r['date'],
                    _formatTime(r['check_in']),
                    _formatTime(r['check_out']),
                    r['status'] ?? 'Present',
                    hrs > 0 ? '${hrs.toStringAsFixed(1)}h' : '-',
                    hrs > 0 ? 'Rs ${(hrs * _hourlyRate).toStringAsFixed(2)}' : '-',
                  ];
                }).toList(),
                headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, color: PdfColors.white),
                headerDecoration: const pw.BoxDecoration(color: PdfColors.blueGrey800),
                cellAlignment: pw.Alignment.centerLeft,
              ),
            ],
          );
        },
      ),
    );

    await Printing.layoutPdf(
      onLayout: (PdfPageFormat format) async => pdf.save(),
      name: 'Attendance_Report.pdf',
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.paper,
      appBar: AppBar(
        title: const Text('My History', style: TextStyle(color: Colors.black87, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.picture_as_pdf, color: AppColors.accent3),
            tooltip: 'Export PDF',
            onPressed: _history.isEmpty ? null : _generateAndPrintPdf,
          )
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _history.isEmpty
              ? const Center(child: Text('No attendance records found.'))
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: _history.length,
                  itemBuilder: (context, index) {
                    final record = _history[index];
                    final checkIn = _formatTime(record['check_in']);
                    final checkOut = _formatTime(record['check_out']);
                    final date = record['date'];
                    final status = record['status'] ?? 'Present';

                    return Container(
                      margin: const EdgeInsets.only(bottom: 16),
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(16),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withValues(alpha: 0.05),
                            blurRadius: 10,
                            offset: const Offset(0, 4),
                          )
                        ],
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              Text(
                                date,
                                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                              ),
                              Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: status == 'Present' ? Colors.green.shade50 : Colors.orange.shade50,
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  status,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                    color: status == 'Present' ? Colors.green.shade700 : Colors.orange.shade700,
                                  ),
                                ),
                              )
                            ],
                          ),
                          const Divider(height: 24),
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              _buildTimeColumn('Check In', checkIn, Icons.login),
                              _buildTimeColumn('Check Out', checkOut, Icons.logout),
                            ],
                          ),
                        ],
                      ),
                    );
                  },
                ),
    );
  }

  Widget _buildTimeColumn(String label, String time, IconData icon) {
    return Row(
      children: [
        Icon(icon, size: 20, color: Colors.grey.shade400),
        const SizedBox(width: 8),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(label, style: TextStyle(fontSize: 12, color: Colors.grey.shade600)),
            Text(time, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          ],
        )
      ],
    );
  }
}

/// Department model.
class Department {
  final String id;
  final String name;
  final String? branchId;
  final String? headEmployeeId;
  final String? headName;
  final int? staffCount;

  const Department({
    required this.id,
    required this.name,
    this.branchId,
    this.headEmployeeId,
    this.headName,
    this.staffCount,
  });

  factory Department.fromJson(Map<String, dynamic> json) {
    return Department(
      id: json['id'] as String,
      name: json['name'] as String,
      branchId: json['branch_id'] as String?,
      headEmployeeId: json['head_employee_id'] as String?,
      headName: json['head_name'] as String?,
      staffCount: json['staff_count'] as int?,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'branch_id': branchId,
        'head_employee_id': headEmployeeId,
        'head_name': headName,
        'staff_count': staffCount,
      };

  static List<Department> get mockDepartments => const [
        Department(id: 'dept-opd', name: 'OPD', staffCount: 25),
        Department(id: 'dept-icu', name: 'ICU', staffCount: 18),
        Department(id: 'dept-ipd', name: 'IPD', staffCount: 22),
        Department(id: 'dept-lab', name: 'Lab', staffCount: 12),
        Department(id: 'dept-pharmacy', name: 'Pharmacy', staffCount: 8),
        Department(id: 'dept-emergency', name: 'Emergency', staffCount: 15),
        Department(id: 'dept-reception', name: 'Reception', staffCount: 6),
        Department(id: 'dept-accounts', name: 'Accounts', staffCount: 5),
      ];
}

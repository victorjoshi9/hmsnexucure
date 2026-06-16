/// Employee roles in HAMS — 4 tier RBAC from PRD.
enum EmployeeRole {
  superAdmin,
  hrManager,
  deptHead,
  staff,
}

/// Employee data model matching the PRD database schema.
class Employee {
  final String id;
  final String employeeCode;
  final String fullName;
  final String? email;
  final String? phone;
  final String departmentId;
  final String? departmentName;
  final String shiftId;
  final String? shiftName;
  final String? designation;
  final String? deviceId;
  final String? faceTemplateId;
  final EmployeeRole role;
  final bool isActive;
  final String? photoUrl;
  final String? branchId;
  final DateTime? createdAt;

  const Employee({
    required this.id,
    required this.employeeCode,
    required this.fullName,
    this.email,
    this.phone,
    required this.departmentId,
    this.departmentName,
    required this.shiftId,
    this.shiftName,
    this.designation,
    this.deviceId,
    this.faceTemplateId,
    required this.role,
    this.isActive = true,
    this.photoUrl,
    this.branchId,
    this.createdAt,
  });

  factory Employee.fromJson(Map<String, dynamic> json) {
    return Employee(
      id: json['id'] as String,
      employeeCode: json['employee_code'] as String,
      fullName: json['full_name'] as String,
      email: json['email'] as String?,
      phone: json['phone'] as String?,
      departmentId: json['department_id'] as String,
      departmentName: json['department_name'] as String?,
      shiftId: json['shift_id'] as String,
      shiftName: json['shift_name'] as String?,
      designation: json['designation'] as String?,
      deviceId: json['device_id'] as String?,
      faceTemplateId: json['face_template_id'] as String?,
      role: EmployeeRole.values.firstWhere(
        (e) => e.name == json['role'],
        orElse: () => EmployeeRole.staff,
      ),
      isActive: json['is_active'] as bool? ?? true,
      photoUrl: json['photo_url'] as String?,
      branchId: json['branch_id'] as String?,
      createdAt: json['created_at'] != null
          ? DateTime.parse(json['created_at'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'employee_code': employeeCode,
        'full_name': fullName,
        'email': email,
        'phone': phone,
        'department_id': departmentId,
        'department_name': departmentName,
        'shift_id': shiftId,
        'shift_name': shiftName,
        'designation': designation,
        'device_id': deviceId,
        'face_template_id': faceTemplateId,
        'role': role.name,
        'is_active': isActive,
        'photo_url': photoUrl,
        'branch_id': branchId,
        'created_at': createdAt?.toIso8601String(),
      };

  Employee copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? designation,
    String? deviceId,
    String? shiftId,
    bool? isActive,
  }) {
    return Employee(
      id: id,
      employeeCode: employeeCode,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      departmentId: departmentId,
      departmentName: departmentName,
      shiftId: shiftId ?? this.shiftId,
      shiftName: shiftName,
      designation: designation ?? this.designation,
      deviceId: deviceId ?? this.deviceId,
      faceTemplateId: faceTemplateId,
      role: role,
      isActive: isActive ?? this.isActive,
      photoUrl: photoUrl,
      branchId: branchId,
      createdAt: createdAt,
    );
  }

  /// Mock employee for demo / Phase 1. - DEPRECATED for production
  static Employee get mock => throw UnimplementedError("Mock data disabled for production");
}

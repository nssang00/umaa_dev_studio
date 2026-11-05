/**
 * UMAA 6.0 ICD-derived SAMPLE type catalog (NOT distributed UMAA .idl files).
 *
 * The selected service/message names originate in the v0.8 seed. The fields
 * below are a curated projection of the attribute tables in the locally
 * supplied SA, MO, MM, EO and SO v6.0 ICD PDFs. The original IDL syntax,
 * includes, DDS-XTypes annotations, bounds, inheritance layout, enums and
 * typedefs have NOT been imported or independently compiled.
 *
 * Conventions: fields are only those declared by the ICD table; inherited
 * common fields are represented by `baseType` and resolved for presentation.
 * '*' in the ICD tables means @key; dagger means @optional. LargeSet shape
 * follows MM ICD §3.8.6's generic template, not an imported generated type.
 */
const f = (name, type, flags = '', description = '') => ({
  name, type, ...(flags.includes('*') ? { key: true } : {}),
  ...(flags.includes('?') ? { optional: true } : {}),
  ...(description ? { description } : {}),
});
const data = (name, namespace, fields, { baseType = null, reference = 'SA ICD 6.0 §6.2', note = '' } = {}) => ({
  id: `umaa-common-${name}`, name, namespace, source: 'standard', kind: 'struct',
  mock: true, provenance: 'icd-attribute-table-mock', reference, baseType, fields,
  ...(note ? { mockNote: note } : {}),
});

export const UMAA_COMMON_TYPE_MOCKS = [
  data('UCSMDEInterfaceSet', 'UMAA', [f('timeStamp', 'DateTime')], { reference: 'SA ICD 6.0 §6.2.1, Table 36' }),
  data('UMAACommand', 'UMAA', [f('source', 'IdentifierType', '*'), f('destination', 'IdentifierType', '*'), f('sessionID', 'NumericGUID', '*')],
    { baseType: 'UMAA::UCSMDEInterfaceSet', reference: 'SA ICD 6.0 §6.2.2, Table 37' }),
  data('UMAAStatus', 'UMAA', [f('source', 'IdentifierType', '*')],
    { baseType: 'UMAA::UCSMDEInterfaceSet', reference: 'SA ICD 6.0 §6.2.3, Table 38' }),
  data('UMAACommandStatusBase', 'UMAA', [f('source', 'IdentifierType', '*'), f('sessionID', 'NumericGUID', '*')],
    { baseType: 'UMAA::UCSMDEInterfaceSet', reference: 'SA ICD 6.0 §6.2.4, Table 39' }),
  data('UMAACommandStatus', 'UMAA', [
    f('commandStatus', 'CommandStatusEnumType'),
    f('commandStatusReason', 'CommandStatusReasonEnumType'),
    f('logMessage', 'StringLongDescription'),
  ], { baseType: 'UMAA::UMAACommandStatusBase', reference: 'SA ICD 6.0 §6.2.5, Table 40' }),
  data('DateTime', 'UMAA::Common::Measurement', [f('seconds', 'DateTimeSeconds'), f('nanoseconds', 'DateTimeNanoSeconds')],
    { reference: 'SA ICD 6.0 §6.2.6, Table 41' }),
  data('GeoPosition2D', 'UMAA::Common::Measurement', [f('geodeticLatitude', 'GeodeticLatitude'), f('geodeticLongitude', 'GeodeticLongitude')],
    { reference: 'SA ICD 6.0 §6.2.14, Table 49' }),
  data('IdentifierType', 'UMAA::Common', [f('id', 'NumericGUID'), f('parentID', 'NumericGUID')],
    { reference: 'SA ICD 6.0 §6.2.15, Table 50' }),
  data('Orientation3DNEDType', 'UMAA::Common::Orientation', [f('pitch', 'PitchYNEDType'), f('roll', 'RollXNEDType'), f('yaw', 'YawZNEDType')],
    { reference: 'SA ICD 6.0 §6.2.17, Table 52' }),
  data('OrientationVel3D', 'UMAA::Common::Measurement', [f('pitchRate', 'PitchRate'), f('rollRate', 'RollRate'), f('yawRate', 'YawRate')],
    { reference: 'SA ICD 6.0 §6.2.18, Table 53' }),
  data('PitchYNEDType', 'UMAA::Common::Orientation', [f('pitch', 'PitchHalfAngle')],
    { reference: 'SA ICD 6.0 §6.2.19, Table 54' }),
  data('RollXNEDType', 'UMAA::Common::Orientation', [f('roll', 'RollAngle')],
    { reference: 'SA ICD 6.0 §6.2.20, Table 55' }),
  data('Velocity3DPlatformNEDType', 'UMAA::Common::Measurement', [f('downSpeed', 'DownSpeed'), f('eastSpeed', 'EastSpeed'), f('northSpeed', 'NorthSpeed')],
    { reference: 'SA ICD 6.0 §6.2.21, Table 56' }),
  data('CovarianceOrientationNEDType', 'UMAA::Common::Measurement', [
    f('rpRp', 'CovarOrientationNED'), f('rpRy', 'CovarOrientationNED', '?'), f('rrRp', 'CovarOrientationNED', '?'),
    f('rrRr', 'CovarOrientationNED'), f('rrRy', 'CovarOrientationNED', '?'), f('ryRy', 'CovarOrientationNED'),
  ], { reference: 'SA ICD 6.0 §6.2.8, Table 43' }),
  data('CovariancePositionNEDType', 'UMAA::Common::Measurement', [
    f('pdPd', 'CovarPosNED', '?'), f('pePd', 'CovarPosNED', '?'), f('pePe', 'CovarPosNED'),
    f('pnPd', 'CovarPosNED', '?'), f('pnPe', 'CovarPosNED', '?'), f('pnPn', 'CovarPosNED'),
  ], { reference: 'SA ICD 6.0 §6.2.11, Table 46' }),
  data('CovarianceVelocityNEDType', 'UMAA::Common::Measurement', [
    f('vdVd', 'CovarVelNED', '?'), f('veVd', 'CovarVelNED', '?'), f('veVe', 'CovarVelNED'),
    f('vnVd', 'CovarVelNED', '?'), f('vnVe', 'CovarVelNED', '?'), f('vnVn', 'CovarVelNED'),
  ], { reference: 'SA ICD 6.0 §6.2.13, Table 48' }),
  data('LargeSetMetadata', 'UMAA::Common', [
    f('setID', 'NumericGUID'), f('updateElementID', 'NumericGUID'),
    f('updateElementTimestamp', 'DateTime', '?'), f('size', 'LargeCollectionSize'),
  ], { reference: 'MM ICD 6.0 §3.8.6, Table 4', note: 'ICD의 일반적인 LargeSetMetadata 정의를 탐색용 Struct로 표현' }),
];

// Only service-specific fields (common fields are resolved using baseType).
// Names and attribute types are taken from ICD tables. This remains a sample
// projection, not a complete or compilable official IDL release.
export const UMAA_MESSAGE_FIELD_MOCKS = {
  GlobalPoseReportType: {
    baseType: 'UMAA::UMAAStatus', reference: 'SA ICD 6.0 §6.1.6.1, Table 19',
    fields: [
      f('altitude', 'MSLAltitude', '?'), f('altitudeAGL', 'DistanceAGL', '?'), f('altitudeASF', 'DistanceASF', '?'),
      f('altitudeGeodetic', 'GeodeticAltitude', '?'), f('attitude', 'Orientation3DNEDType'),
      f('attitudeCovariance', 'CovarianceOrientationNEDType', '?'), f('course', 'CourseTrueNorth'),
      f('depth', 'DistanceBSL', '?'), f('navigationSolution', 'NavigationSolutionEnumType'),
      f('position', 'GeoPosition2D'), f('positionCovariance', 'CovariancePositionNEDType', '?'),
    ],
  },
  SpeedReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SA ICD 6.0 §6.1.10.1, Table 27', fields: [
    f('mode', 'VehicleSpeedModeEnumType', '?'), f('speedOverGround', 'GroundSpeed', '?'),
    f('speedThroughAir', 'IndicatedAirspeed', '?'), f('speedThroughWater', 'SpeedLocalWaterMass', '?'),
  ] },
  VelocityReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SA ICD 6.0 §6.1.12.1, Table 31', fields: [
    f('attitudeRate', 'OrientationVel3D'), f('attitudeRateCovariance', 'CovarianceOrientationVelocityNEDType', '?'),
    f('velocity', 'Velocity3DPlatformNEDType'), f('velocityCovariance', 'CovarianceVelocityNEDType', '?'),
  ] },
  WindReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SA ICD 6.0 §6.1.14.1, Table 35', fields: [
    f('relativeAverageDirection', 'RelativeAngle', '?'), f('relativeAverageSpeed', 'Speed', '?'),
    f('relativeInstantaneousDirection', 'RelativeAngle', '?'), f('relativeInstantaneousSpeed', 'Speed', '?'),
    f('relativeMaximumDirection', 'RelativeAngle', '?'), f('relativeMaximumSpeed', 'Speed', '?'),
    f('relativeMinimumDirection', 'RelativeAngle', '?'), f('relativeMinimumSpeed', 'Speed', '?'),
    f('straightDeckCrossSpeed', 'Speed', '?'), f('straightDeckHeadSpeed', 'Speed', '?'),
    f('trueMaximumDirection', 'AzimuthTrueNorthAngle', '?'), f('trueMaximumSpeed', 'GroundSpeed', '?'),
    f('trueMinimumDirection', 'AzimuthTrueNorthAngle', '?'), f('trueMinimumSpeed', 'GroundSpeed', '?'),
  ], mockNote: 'Wind 필드 중 ICD에 등장하는 대표 항목을 선택했으며 전체 메시지 완전성은 보장하지 않음' },
  WaterCurrentReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SA ICD 6.0 §6.1.13.1, Table 33', fields: [
    f('currentDirection', 'HeadingTrueNorthAngle'), f('currentSpeed', 'Speed'),
  ] },
  HealthReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SO ICD 6.0 §5.1.1.1, Table 9', fields: [
    f('logTime', 'DateTime'), f('severity', 'ErrorConditionEnumType'), f('status', 'StringLongDescription', '?'),
    f('code', 'ErrorCodeEnumType', '*'), f('resourceID', 'IdentifierType', '*'),
  ] },
  LogReportType: { baseType: 'UMAA::UMAAStatus', reference: 'SO ICD 6.0 §5.1.2.1, Table 11', fields: [
    f('entry', 'StringLongDescription'), f('level', 'LogLevelEnumType'),
  ] },
  UVPlatformCapabilitiesReportType: { baseType: 'UMAA::UMAAStatus', reference: 'EO ICD 6.0 §6.1.14, Table 41', fields: [
    f('minWaterDepth', 'DistanceBSL'), f('surfaceCapabilities', 'SurfaceCapabilityLimitsType'),
    f('towingCapacity', 'MassMetricTon', '?'), f('underwaterCapabilities', 'UnderwaterCapabilityLimitsType', '?'),
  ] },
  UVPlatformSpecsReportType: { baseType: 'UMAA::UMAAStatus', reference: 'EO ICD 6.0 §6.1.14, Table 42', fields: [
    f('aftDistance', 'Distance'), f('beamAtWaterline', 'Distance'), f('bottomDistance', 'Distance'),
    f('centerOfBuoyancy', 'Position3DBodyXYZ'), f('centerOfGravity', 'Position3DBodyXYZ'),
    f('diameter', 'Distance', '?'), f('displacement', 'MassMetricTon'), f('draft', 'Distance'),
    f('forwardDistance', 'Distance'), f('lengthAtWaterline', 'Distance'), f('name', 'StringShortDescription'),
    f('portDistance', 'Distance'), f('referenceFrameOrigin', 'ReferenceFrameOriginEnumType'),
    f('starboardDistance', 'Distance'), f('topDistance', 'Distance'), f('weightInWater', 'MassMetricTon', '?'),
    f('weightLight', 'MassMetricTon'), f('weightLoaded', 'MassMetricTon'),
  ] },
  ConditionalReportType: { baseType: 'UMAA::UMAAStatus', reference: 'MM ICD 6.0 §6.1.3.1, Table 20', fields: [
    f('conditionals', 'LargeSet<ConditionalType>'),
  ], mockNote: 'conditionals→setID Large Set: Metadata/Element 별도 Topic 및 동기화 요구. 일반 sequence가 아님.' },
  ConditionalReportTypeConditionalsSetElement: { reference: 'MM ICD 6.0 §3.8.6, Table 5 + §6.1.3.1', fields: [
    f('element', 'ConditionalType'), f('setID', 'NumericGUID', '*'),
    f('elementID', 'NumericGUID', '*'), f('elementTimestamp', 'DateTime'),
  ], mockNote: 'MM ICD의 일반 LargeSet Element 템플릿을 ConditionalType에 적용한 설계용 예시. 공식 생성 IDL과 미대조.' },
  ActiveConstraintsCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MM ICD 6.0 §6.1.1, Table 11', fields: [
    f('constraintConditionalIDs', 'sequence<NumericGUID>'),
  ] },
  ActiveConstraintsCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MM ICD 6.0 §6.1.1', fields: [] },
  ActiveConstraintsCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MM ICD 6.0 §6.1.1', fields: [
    f('command', 'ActiveConstraintsCommandType'),
  ] },
  MissionPlanConstraintAddCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MM ICD 6.0 §6.1.4.5, Table 26', fields: [
    f('constraint', 'ConstraintType'),
  ] },
  MissionPlanConstraintAddCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MM ICD 6.0 §6.1.4.2, Table 23', fields: [] },
  MissionPlanConstraintAddCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MM ICD 6.0 §6.1.4.1, Table 22', fields: [
    f('command', 'MissionPlanConstraintAddCommandType'),
  ] },
  MissionPlanConstraintDeleteCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MM ICD 6.0 §6.1.4.6, Table 27', fields: [
    f('constraintID', 'NumericGUID', '?'),
  ] },
  MissionPlanConstraintDeleteCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MM ICD 6.0 §6.1.4.4, Table 25', fields: [] },
  MissionPlanConstraintDeleteCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MM ICD 6.0 §6.1.4.3, Table 24', fields: [
    f('command', 'MissionPlanConstraintDeleteCommandType'),
  ] },
  GlobalVectorCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MO ICD 6.0 §6.1.5.4, Table 26', fields: [
    f('depthChangePitch', 'PitchYNEDRequirement', '?'), f('direction', 'DirectionRequirementVariantType'),
    f('directionMode', 'DirectionModeEnumType'), f('elevation', 'ElevationRequirementVariantType', '?'),
    f('endTime', 'DateTime', '?'), f('speed', 'SpeedRequirementVariantType'),
  ] },
  GlobalVectorCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MO ICD 6.0 §6.1.5.2, Table 24', fields: [] },
  GlobalVectorCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.5.1, Table 23', fields: [
    f('command', 'GlobalVectorCommandType'),
  ] },
  GlobalVectorExecutionStatusReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.5.3, Table 25', fields: [
    f('directionAchieved', 'boolean'), f('elevationAchieved', 'boolean'), f('speedAchieved', 'boolean'),
  ] },
  GlobalHoverCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MO ICD 6.0 §6.1.4.4, Table 21', fields: [
    f('controlPriority', 'HoverKindEnumType'), f('elevation', 'ElevationRequirementVariantType', '?'),
    f('endTime', 'DateTime', '?'), f('heading', 'DirectionRequirementVariantType', '?'),
    f('hoverRadius', 'DistanceRequirementType'), f('position', 'GeoPosition2D'),
    f('transitElevation', 'ElevationVariantType', '?'), f('transitSpeed', 'SpeedVariantType'),
  ] },
  GlobalHoverCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MO ICD 6.0 §6.1.4.2, Table 19', fields: [] },
  GlobalHoverCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.4.1, Table 18', fields: [
    f('command', 'GlobalHoverCommandType'),
  ] },
  GlobalHoverExecutionStatusReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.4.3, Table 20', fields: [
    f('globalHoverState', 'GlobalHoverStateType'), f('timeHoverAchieved', 'DateTime'), f('timeHoverCompleted', 'DateTime', '?'),
  ] },
  PrimitiveDriverCommandType: { baseType: 'UMAA::UMAACommand', reference: 'MO ICD 6.0 §6.1.7.4, Table 36', fields: [
    f('propulsiveLinearEffort', 'LinearEffort'), f('propulsiveRotationalEffort', 'RotationalEffort'),
    f('resistiveLinearEffort', 'LinearEffort'), f('resistiveRotationalEffort', 'RotationalEffort'),
  ] },
  PrimitiveDriverCommandStatusType: { baseType: 'UMAA::UMAACommandStatus', reference: 'MO ICD 6.0 §6.1.7.2, Table 34', fields: [] },
  PrimitiveDriverCommandAckReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.7.1, Table 33', fields: [
    f('command', 'PrimitiveDriverCommandType'),
  ] },
  PrimitiveDriverExecutionStatusReportType: { baseType: 'UMAA::UMAACommandStatusBase', reference: 'MO ICD 6.0 §6.1.7.3, Table 35', fields: [
    f('propulsiveLinearEffort', 'LinearEffort'), f('propulsiveRotationalEffort', 'RotationalEffort'),
    f('resistiveLinearEffort', 'LinearEffort'), f('resistiveRotationalEffort', 'RotationalEffort'),
  ] },
};

/** Return a new workspace enriched with the read-only example fields.
 *  Old saved v0.8 workspaces are upgraded without overwriting user custom types. */
export function withMockIdlTypes(workspace) {
  const messages = (workspace.messages ?? []).map(message => {
    if (message.source === 'custom' || message.projectOverride) return message;
    const catalog = UMAA_MESSAGE_FIELD_MOCKS[message.name];
    if (!catalog) return message;
    return {
      ...message, kind: 'struct', mock: true, provenance: 'icd-attribute-table-mock',
      reference: catalog.reference, baseType: catalog.baseType ?? null,
      fields: structuredClone(catalog.fields),
      ...(catalog.mockNote ? { mockNote: catalog.mockNote } : {}),
      externalIdlPath: message.externalIdlPath ?? `${message.namespace}::${message.name}`,
    };
  });
  const known = new Set((workspace.dataTypes ?? []).map(type => `${type.namespace}::${type.name}`));
  const dataTypes = [...(workspace.dataTypes ?? [])];
  for (const sample of UMAA_COMMON_TYPE_MOCKS) {
    if (!known.has(`${sample.namespace}::${sample.name}`)) dataTypes.push(structuredClone(sample));
  }
  return { ...workspace, messages, dataTypes };
}

export function effectiveTypeFields(workspace, type, visited = new Set()) {
  if (!type || visited.has(`${type.namespace}::${type.name}`)) return [];
  const next = new Set(visited);
  next.add(`${type.namespace}::${type.name}`);
  const all = [...(workspace.messages ?? []), ...(workspace.dataTypes ?? [])];
  const parent = all.find(candidate => `${candidate.namespace}::${candidate.name}` === type.baseType);
  return [
    ...effectiveTypeFields(workspace, parent, next).map(field => ({ ...field, inherited: true })),
    ...(type.fields ?? []).map(field => ({ ...field, inherited: false, declaredIn: type.name })),
  ];
}

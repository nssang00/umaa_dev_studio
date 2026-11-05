import { deriveEndpoints } from './endpoints.js';
import { validateWorkspace } from './validation.js';
import { defaultRuntime } from '../model/workspaceSchema.js';
const ident = (s) => s.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^([^a-zA-Z_])/, '_$1');
const safeName = (s) => ident(s).replace(/_+/g, '_');
const toIdlType = (t) => t;
const cmakeTarget = (name) => safeName(name);
function generateCustomIdl(message) {
    const parts = message.namespace.split('::').map(ident).filter(Boolean);
    const open = parts.map((part, i) => `${'  '.repeat(i)}module ${part} {`).join('\n');
    const close = parts.map((_, i) => `${'  '.repeat(parts.length - i - 1)}};`).join('\n');
    const fields = message.fields.map(f => {
        const annotations = `${f.key ? '@key ' : ''}${f.optional ? '@optional ' : ''}`;
        return `${'  '.repeat(parts.length + 1)}${annotations}${toIdlType(f.type)} ${ident(f.name)};`;
    }).join('\n');
    return [
        '// GENERATED CUSTOM IDL — NOT AN OFFICIAL UMAA DEFINITION',
        '// Review IDL compatibility and vendor-specific generation before DDS deployment.',
        open,
        `${'  '.repeat(parts.length)}struct ${ident(message.name)} {`,
        fields,
        `${'  '.repeat(parts.length)}};`,
        close,
        '',
    ].filter(v => v !== '').join('\n');
}
const cppString = (s) => JSON.stringify(s).replace(/\\u/g, '\\u');
/**
 * Mock code generation: builds a compilable C++ shared-library scaffold,
 * endpoint inventory, and custom IDLs. No DDS communication is claimed.
 */
export function generateComponentFiles(s, componentId) {
    const invalid = validateWorkspace(s).filter(issue => issue.severity === 'error');
    if (invalid.length)
        throw new Error(`설계 오류 ${invalid.length}건이 있어 생성할 수 없습니다.`);
    const component = s.components.find(c => c.id === componentId);
    if (!component)
        throw new Error('Component를 찾을 수 없습니다.');
    const target = cmakeTarget(component.name);
    const endpoints = deriveEndpoints(s, component.id);
    const runtime = { ...defaultRuntime(), ...s.componentRuntime?.[component.id] };
    const qos = s.qosProfiles?.find(p => p.id === runtime.qosProfileId) ?? null;
    const bindings = s.bindings.filter(b => b.componentId === component.id);
    const serviceInfos = bindings.map(b => ({
        bindingId: b.id,
        role: b.role,
        service: s.services.find(v => v.id === b.serviceId),
    }));
    const messageIds = new Set(endpoints.map(e => e.messageTypeId));
    const messages = s.messages.filter(m => messageIds.has(m.id));
    const standardMessages = messages.filter(m => m.source === 'standard');
    const customMessages = messages.filter(m => m.source === 'custom');
    const projectTypeOverrides=[...s.messages,...(s.dataTypes??[])].filter(t=>t.projectOverride);
    const files = [];
    const file = (path, content) => files.push({ path, content });
    const endpointHeader = `#pragma once
#include <array>
#include <cstddef>

namespace umaa_generated {
struct EndpointSpec {
  const char* service;
  const char* role;
  const char* direction;
  const char* topic;
  const char* messageType;
  bool optional;
};
inline constexpr std::array<EndpointSpec, ${endpoints.length}> kEndpoints = {{
${endpoints.map(e => `  {${cppString(e.serviceName)}, ${cppString(e.role)}, ${cppString(e.direction)}, ${cppString(e.topicName)}, ${cppString(e.typeName)}, ${e.optional ? 'true' : 'false'}},`).join('\n')}
}};
} // namespace umaa_generated
`;
    file('generated/endpoints.hpp', endpointHeader);
    file('include/component_api.h', `#pragma once
#if defined(_WIN32)
#define UMAA_COMPONENT_API extern "C" __declspec(dllexport)
#else
#define UMAA_COMPONENT_API extern "C" __attribute__((visibility("default")))
#endif
// Stable C ABI skeleton: version and configuration are added without C++ ABI exposure.
UMAA_COMPONENT_API unsigned int umaa_component_abi_version();
UMAA_COMPONENT_API const char* umaa_component_name();
UMAA_COMPONENT_API int umaa_component_configure(const char* json_utf8);
UMAA_COMPONENT_API int umaa_component_start();
UMAA_COMPONENT_API void umaa_component_stop();
`);
    file('src/component.cpp', `#include "component_api.h"
#include "endpoints.hpp"
#include <iostream>

// Mock runnable scaffold only: no DDS DomainParticipant / DataWriter / DataReader yet.
static bool g_configured = false;
UMAA_COMPONENT_API unsigned int umaa_component_abi_version() { return 1; }
UMAA_COMPONENT_API int umaa_component_configure(const char* json_utf8) {
  // Skeleton only; load/validate JSON, DDS participants and policies in the real runtime.
  g_configured = (json_utf8 != nullptr);
  return g_configured ? 0 : -1;
}
UMAA_COMPONENT_API const char* umaa_component_name() {
  return ${cppString(component.name)};
}
UMAA_COMPONENT_API int umaa_component_start() {
  std::cout << "[UMAA MOCK] start: " << umaa_component_name() << "\\n";
  std::cout << "[UMAA MOCK] configured endpoints: "
            << umaa_generated::kEndpoints.size() << "\\n";
  return 0;
}
UMAA_COMPONENT_API void umaa_component_stop() {
  std::cout << "[UMAA MOCK] stop: " << umaa_component_name() << "\\n";
}
`);
    file('CMakeLists.txt', `cmake_minimum_required(VERSION 3.20)
project(${target} VERSION 0.1.0 LANGUAGES CXX)
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Mock builds a DLL/SO with stable C ABI; actual DDS bindings are a future step.
add_library(${target} SHARED src/component.cpp)
target_include_directories(${target} PRIVATE include generated)
set_target_properties(${target} PROPERTIES OUTPUT_NAME ${target})

# TODO: Integrate official UMAA IDL and chosen DDS vendor's type generator.
# TODO: Link UMAA runtime, DDS libraries, and generated Service adapters.
`);
    // Machine-readable complete contract projection for each Service binding.
    // Standard IDL field schemas remain external dependencies (never fabricated).
    const contractRows = serviceInfos.map(({bindingId, role, service}) => {
        const interfaces = s.interfaces.filter(i => i.serviceId === service?.id);
        const operations = s.operations.filter(o => o.serviceId === service?.id).map(op => {
            const topic = s.topics.find(t => t.id === op.topicId);
            const type = s.messages.find(m => m.id === topic?.messageTypeId);
            return {name:op.name,actor:op.actor,action:op.action,optionalConsumer:!!op.optionalConsumer,
                topic:topic?.name,type:type?.name,namespace:type?.namespace,standardIDLLinked:false};
        });
        return {bindingId,service:service?.name,role,flowControl:service?.flowControl,
            interfaces:interfaces.map(i=>({name:i.name,operationIds:i.operationIds})),operations};
    });
    file('contracts/service-operations.json', JSON.stringify({
        source:'UMAA 6.0 ICD (curated mock contract; official IDL required)',
        component:component.name, serviceCount:contractRows.length,
        contract:contractRows,
    }, null, 2) + '\n');
    const csvEscape = v => '"' + String(v??'').replaceAll('"','""') + '"';
    file('contracts/topic-endpoints.csv', [
        ['service','bindingRole','endpointDirection','topic','idlType','optional','dataRule'].join(','),
        ...endpoints.map(e => [e.serviceName,e.role,e.direction,e.topicName,e.typeName,e.optional,
            e.relatedRule??''].map(csvEscape).join(','))
    ].join('\n')+'\n');
    file('contracts/project-assets.json', JSON.stringify({
        topics:(s.topics??[]).filter(t=>t.source==='custom'),
        dataTypes:(s.messages??[]).filter(m=>m.source==='custom').map(m=>({id:m.id,name:m.name,namespace:m.namespace,kind:m.kind??'struct',fields:m.fields})),
        qosProfiles:(s.qosProfiles??[]).filter(q=>q.source==='project'),
        note:'Project asset registry metadata; standalone assets do not create runtime DDS endpoints until bound through a Service.'
    },null,2)+'\n');
    file('component.manifest.json', JSON.stringify({
        schemaVersion: 1,
        generationLevel: 'mock-scaffold',
        component: { id: component.id, name: component.name },
        project: { name: s.project.name, umaaVersion: s.project.standardVersion, platform: s.project.targetPlatform, ddsVendor: s.project.ddsVendor },
        services: serviceInfos.map(x => ({ bindingId: x.bindingId, role: x.role, name: x.service?.name, origin: x.service?.source, flowControl: x.service?.flowControl })),
        interfaces: (s.interfaces ?? []).filter(i => serviceInfos.some(b => b.service?.id === i.serviceId))
            .map(i => ({ name: i.name, serviceId: i.serviceId, operationNames: i.operationIds.map(id => s.operations.find(o => o.id === id)?.name) })),
        topicRelations: (s.topicRelations ?? []).filter(r => endpoints.some(e => e.topicName === s.topics.find(t => t.id === r.parentTopicId)?.name))
            .map(r => ({ kind: r.kind, metadataTopic: s.topics.find(t => t.id === r.parentTopicId)?.name,
            elementTopic: s.topics.find(t => t.id === r.relatedTopicId)?.name, description: r.description })),
        endpoints,
        runtimeConfiguration: runtime,
        qosProfile: qos,
        requiredStandardIDL: standardMessages.map(m => ({ name: m.name, namespace: m.namespace, externalIdlPath: m.externalIdlPath })),
        customIDL: customMessages.map(m => m.name),
        projectTypeOverrides: projectTypeOverrides.map(t=>({name:t.name,namespace:t.namespace,reference:t.reference??null})),
        caveats: ['No DDS vendor code generated', 'No runtime UMAA compliance claim', 'ICD field mocks are not official IDL and are excluded from generated standard IDL'],
    }, null, 2) + '\n');
    file('contracts/icd-patterns.json', JSON.stringify({
      reference:'UMAA ICD 6.0 §3.4, §3.8, §3.9, §5.1, §5.2',
      note:'Design metadata only: no DDS flow control or synchronization generated.',
      services:serviceInfos.map(({service})=>({service:service?.name,serviceCategory:service?.serviceCategory??null,flowControl:service?.flowControl})),
      topicRelations:(s.topicRelations??[]).filter(r=>endpoints.some(e=>e.topicName===s.topics.find(t=>t.id===r.parentTopicId)?.name||e.topicName===s.topics.find(t=>t.id===r.relatedTopicId)?.name)),
      qosProfiles:s.qosProfiles??[],
    },null,2)+'\n');
    file('contracts/type-overrides.json',JSON.stringify({note:'Project override of ICD-derived MOCK; never official IDL or compiled TypeSupport.',types:projectTypeOverrides.map(t=>({id:t.id,name:t.name,namespace:t.namespace,baseType:t.baseType??null,fields:t.fields??[],members:t.members??[]}))},null,2)+'\n');
    file('idl/standard/README.md', `# Official UMAA IDL dependencies

These **standard** definitions must be resolved from the official UMAA ${s.project.standardVersion} IDL distribution.
The mock generator does **not** invent or overwrite standard IDL files.

${standardMessages.map(m => `- \`${m.namespace}::${m.name}\` — ${m.externalIdlPath ?? 'Official release required'}`).join('\n') || '- (none)'}

When real DDS generation is connected, resolve exact IDL files, transitive includes, namespaces, keys, and the selected vendor compiler.
`);
    for (const m of customMessages)
        file(`idl/custom/${safeName(m.name)}.idl`, generateCustomIdl(m));
    file('README.md', `# ${component.name} — UMAA Web IDE mock generation

## Build

\`\`\`sh
cmake -S . -B build
cmake --build build --config Release
\`\`\`

This produces a shared library (\`.so\` on Linux, \`.dll\` on Windows).
The library exposes a versioned configuration/lifecycle C ABI skeleton and prints mock endpoint metadata.
**It does not contain working DDS transport, command flow control, or UMAA compliance implementation.**

## Generated service bindings

${serviceInfos.map(x => `- ${x.role.toUpperCase()}: ${x.service?.name ?? 'Unknown'}`).join('\n') || '- (none)'}

## DDS mapping

${endpoints.map(e => `- ${e.direction.toUpperCase()} ${e.topicName} (${e.typeName}): ${e.serviceName} / ${e.role}${e.optional ? ' [optional consumer subscription]' : ''}`).join('\n') || '- (none)'}

## Next integration step

1. Mount exact official UMAA IDLs and selected DDS SDK (${s.project.ddsVendor}).
2. Resolve type dependencies and compile IDL through vendor tools.
3. Replace mock lifecycle with DDS participant + endpoint adapters.
4. Implement and test the normative flow-control procedures for the referenced UMAA ICD services.
5. Wire the generated plugin into the Component Host with ABI-version checks.
`);
    file('tests/README.md', `# Contract and runtime tests (not implemented by mock)

Planned: message type compatibility, endpoint QoS, Command/Response state transitions,
Request/Reply subscription behavior, cancellation via DDS dispose,
Large Collections and Generalization/Specialization when used.
`);
    file('config/dds-profile.json', JSON.stringify({ vendor: s.project.ddsVendor, ...runtime, qosProfile: qos, note: 'Configuration values from the IDE; not applied to real DDS middleware by this mock library.' }, null, 2) + '\n');
    file('config/runtime.json', JSON.stringify({ componentId: component.id, componentName: component.name, abiVersion: 1, hostMode: runtime.hostMode, artifact: runtime.artifact, commandArbitration: runtime.commandArbitration, lifecycle: ['configure','start','stop'] }, null, 2) + '\n');
    file('contracts/communication-patterns.json', JSON.stringify({ component: component.name, contracts: serviceInfos.map(({ role, service })=>({
        service: service?.name, source: service?.source, role, template: service?.flowControl,
        operations: s.operations.filter(op=>op.serviceId===service?.id).map(op=>{
            const topic=s.topics.find(t=>t.id===op.topicId), msg=s.messages.find(m=>m.id===topic?.messageTypeId);
            return {operation:op.name,actor:op.actor,action:op.action,topic:topic?.name,type:msg?.name,optionalConsumer:!!op.optionalConsumer};
        }),
    })) }, null, 2) + '\n');
    // Project user DataType definitions; actual DDS vendor compilation is not linked.
    for (const t of (s.dataTypes ?? []).filter(t=>t.source==='custom')) {
        const moduleNames=t.namespace.split('::').filter(Boolean).map(ident);
        const prefix=moduleNames.map((name,i)=>`${'  '.repeat(i)}module ${name} {`).join('\n');
        const suffix=moduleNames.slice().reverse().map((_,i)=>`${'  '.repeat(moduleNames.length-i-1)}};`).join('\n');
        const declaration=t.kind==='enum' ? `enum ${ident(t.name)} { ${t.members.join(', ')} };` :
            `struct ${ident(t.name)} {\n${t.fields.map(f=>`  ${f.type} ${ident(f.name)};`).join('\n')}\n};`;
        file(`idl/custom-types/${safeName(t.name)}.idl`, `// PROJECT EXTENSION - not official UMAA IDL\n${prefix}\n${declaration}\n${suffix}\n`);
    }
    return files;
}
export function generateAllComponentFiles(s) {
    return s.components.flatMap(c => generateComponentFiles(s, c.id).map(f => ({ path: `${safeName(c.name)}/${f.path}`, content: f.content })));
}
export const componentBuildSummary = (s, componentId) => {
    const c = s.components.find(c => c.id === componentId);
    if (!c)
        return '';
    const endpoints = deriveEndpoints(s, componentId);
    return `${c.name}: ${endpoints.filter(e => e.direction === 'writer').length} writer(s), ${endpoints.filter(e => e.direction === 'reader').length} reader(s), services: ${s.bindings.filter(b => b.componentId === componentId).map(b => s.services.find(v => v.id === b.serviceId)?.name).join(', ')}`;
};

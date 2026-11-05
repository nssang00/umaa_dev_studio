-- PostgreSQL DESIGN SKETCH: NOT EXECUTED BY MOCK MVP.
-- Apply migrations and access controls before production usage.
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    umaa_version TEXT NOT NULL,
    dds_vendor TEXT NOT NULL,
    target_platform TEXT NOT NULL,
    revision BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE components (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL REFERENCES projects(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE service_definitions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    source_kind TEXT NOT NULL CHECK (source_kind IN ('standard','custom')),
    owner_project_id TEXT NULL REFERENCES projects(id),
    functional_area TEXT NOT NULL,
    namespace TEXT NOT NULL,
    version TEXT NOT NULL,
    flow_control TEXT NOT NULL CHECK (flow_control IN ('request-reply','command-response')),
    description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE message_types (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    namespace TEXT NOT NULL,
    source_kind TEXT NOT NULL,
    external_idl_path TEXT,
    fields JSONB NOT NULL DEFAULT '[]'::jsonb
);
CREATE TABLE topics (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    message_type_id TEXT NOT NULL REFERENCES message_types(id)
);
CREATE TABLE service_operations (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES service_definitions(id),
    name TEXT NOT NULL,
    topic_id TEXT NOT NULL REFERENCES topics(id),
    action TEXT NOT NULL CHECK (action IN ('publish','subscribe','dispose')),
    actor TEXT NOT NULL CHECK (actor IN ('provider','consumer')),
    optional_consumer BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE TABLE service_bindings (
    id TEXT PRIMARY KEY,
    component_id TEXT NOT NULL REFERENCES components(id) ON DELETE CASCADE,
    service_id TEXT NOT NULL REFERENCES service_definitions(id),
    role TEXT NOT NULL CHECK (role IN ('provider','consumer')),
    UNIQUE (component_id,service_id,role)
);
CREATE TABLE service_connections (
    id TEXT PRIMARY KEY,
    provider_binding_id TEXT NOT NULL REFERENCES service_bindings(id) ON DELETE CASCADE,
    consumer_binding_id TEXT NOT NULL REFERENCES service_bindings(id) ON DELETE CASCADE,
    UNIQUE (provider_binding_id,consumer_binding_id)
);
CREATE TABLE component_diagram_positions (
    component_id TEXT PRIMARY KEY REFERENCES components(id) ON DELETE CASCADE,
    x DOUBLE PRECISION NOT NULL,
    y DOUBLE PRECISION NOT NULL
);
-- server-side validation: cross-component service/binding consistency,
-- immutable standard catalogs, user project permissions, revision optimistic locking,
-- IDL syntactic and semantic validation, transactional saves.

-- Extensions for the v0.3 static ICD example model; plan real migrations before use.
CREATE TABLE functional_areas (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    icd_document TEXT NOT NULL
);
-- Tool-side operation groups; must not be mistaken for official SoaML interface identifiers.
CREATE TABLE service_interface_groups (
    id TEXT PRIMARY KEY,
    service_id TEXT NOT NULL REFERENCES service_definitions(id),
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);
CREATE TABLE service_interface_operations (
    interface_id TEXT NOT NULL REFERENCES service_interface_groups(id) ON DELETE CASCADE,
    operation_id TEXT NOT NULL REFERENCES service_operations(id),
    PRIMARY KEY (interface_id, operation_id)
);
CREATE TABLE topic_relations (
    id TEXT PRIMARY KEY,
    kind TEXT NOT NULL CHECK (kind IN ('large-set-element','large-list-element','specialization')),
    parent_topic_id TEXT NOT NULL REFERENCES topics(id),
    related_topic_id TEXT NOT NULL REFERENCES topics(id),
    description TEXT NOT NULL DEFAULT ''
);

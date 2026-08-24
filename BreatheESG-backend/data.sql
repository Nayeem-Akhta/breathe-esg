INSERT INTO organizations (id, name, slug, is_active, created_at)
VALUES (
    'bdd9be7c-d742-4c79-9371-902c02aa3872',
    'Primary Organization',
    'primary-org',
    true,
    CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;
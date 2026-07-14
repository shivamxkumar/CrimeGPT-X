"""Initial schema — all tables

Revision ID: 001_initial
Revises: 
Create Date: 2024-06-12 09:00:00.000000
"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('badge_number', sa.String(50), nullable=False),
        sa.Column('name', sa.String(150), nullable=False),
        sa.Column('email', sa.String(200), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('hashed_password', sa.String(200), nullable=False),
        sa.Column('role', sa.Enum('io','sho','legal','admin', name='userrole'), nullable=False),
        sa.Column('police_station', sa.String(200)),
        sa.Column('rank', sa.String(100)),
        sa.Column('is_active', sa.Boolean(), default=True),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('last_login', sa.DateTime(timezone=True)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('badge_number'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_badge', 'users', ['badge_number'])
    op.create_index('ix_users_email',  'users', ['email'])

    # cases
    op.create_table('cases',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', sa.String(30), nullable=False),
        sa.Column('fir_number', sa.String(50)),
        sa.Column('fir_date', sa.DateTime(timezone=True)),
        sa.Column('police_station', sa.String(200), nullable=False),
        sa.Column('crime_category', sa.Enum(
            'upi_fraud','phishing','investment_scam','whatsapp_fraud',
            'social_media','otp_fraud','fake_app','sextortion','ransomware','other',
            name='crimecategory'), nullable=False),
        sa.Column('status', sa.Enum(
            'registered','active','in_review','chargesheet','court','closed',
            name='casestatus'), default='registered'),
        sa.Column('priority', sa.Enum('low','medium','high','critical', name='casepriority'), default='medium'),
        sa.Column('victim_name', sa.String(200), nullable=False),
        sa.Column('victim_phone', sa.String(20)),
        sa.Column('victim_email', sa.String(200)),
        sa.Column('victim_address', sa.Text()),
        sa.Column('victim_age', sa.Integer()),
        sa.Column('amount_defrauded', sa.Float(), default=0.0),
        sa.Column('accused_name', sa.String(200), default='Unknown'),
        sa.Column('accused_phone', sa.String(20)),
        sa.Column('accused_address', sa.Text()),
        sa.Column('accused_mode', sa.String(200)),
        sa.Column('witnesses', postgresql.JSONB(), default=list),
        sa.Column('incident_description', sa.Text(), nullable=False),
        sa.Column('incident_location', sa.String(500)),
        sa.Column('incident_date', sa.DateTime(timezone=True)),
        sa.Column('ai_sections', postgresql.JSONB(), default=list),
        sa.Column('ai_judgments', postgresql.JSONB(), default=list),
        sa.Column('ai_analysis_raw', sa.Text()),
        sa.Column('ai_analyzed_at', sa.DateTime(timezone=True)),
        sa.Column('fir_file_path', sa.String(500)),
        sa.Column('fir_ocr_text', sa.Text()),
        sa.Column('fir_ocr_fields', postgresql.JSONB(), default=dict),
        sa.Column('io_officer_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.Column('closed_at', sa.DateTime(timezone=True)),
        sa.Column('court_submission_date', sa.DateTime(timezone=True)),
        sa.ForeignKeyConstraint(['io_officer_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('case_id'),
    )
    op.create_index('ix_cases_case_id',   'cases', ['case_id'])
    op.create_index('ix_cases_victim',    'cases', ['victim_name'])
    op.create_index('ix_cases_accused',   'cases', ['accused_name'])
    op.create_index('ix_cases_cat_status','cases', ['crime_category','status'])

    # evidence
    op.create_table('evidence',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('uploaded_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('file_name', sa.String(300), nullable=False),
        sa.Column('original_name', sa.String(300), nullable=False),
        sa.Column('file_path', sa.String(500), nullable=False),
        sa.Column('file_size', sa.BigInteger(), default=0),
        sa.Column('mime_type', sa.String(100)),
        sa.Column('evidence_type', sa.Enum(
            'image','video','audio','pdf','document','screenshot',
            'chat_export','bank_statement','other', name='evidencetype'), nullable=False),
        sa.Column('category', sa.Enum(
            'critical','primary','supporting','corroborative', name='evidencecategory')),
        sa.Column('sha256_hash', sa.String(64), nullable=False),
        sa.Column('md5_hash', sa.String(32)),
        sa.Column('is_verified', sa.Boolean(), default=False),
        sa.Column('verified_by_id', postgresql.UUID(as_uuid=True)),
        sa.Column('verified_at', sa.DateTime(timezone=True)),
        sa.Column('ai_analysis', postgresql.JSONB(), default=dict),
        sa.Column('ocr_text', sa.Text()),
        sa.Column('tags', postgresql.ARRAY(sa.String()), default=list),
        sa.Column('description', sa.Text()),
        sa.Column('custody_chain', postgresql.JSONB(), default=list),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['uploaded_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_evidence_case', 'evidence', ['case_id'])

    # documents
    op.create_table('documents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('generated_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('doc_type', sa.Enum(
            'chargesheet','purvani_chargesheet','remand_request','medical_letter',
            'seizure_receipt','court_custody','panchanama','face_id_form',
            'witness_statement','arrest_memo', name='documenttype'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('language', sa.String(10), default='en'),
        sa.Column('docx_path', sa.String(500)),
        sa.Column('pdf_path', sa.String(500)),
        sa.Column('content_json', postgresql.JSONB(), default=dict),
        sa.Column('content_html', sa.Text()),
        sa.Column('ai_model_used', sa.String(100)),
        sa.Column('ai_prompt_tokens', sa.Integer(), default=0),
        sa.Column('generation_time_ms', sa.Integer(), default=0),
        sa.Column('is_reviewed', sa.Boolean(), default=False),
        sa.Column('reviewed_by_id', postgresql.UUID(as_uuid=True)),
        sa.Column('reviewed_at', sa.DateTime(timezone=True)),
        sa.Column('review_notes', sa.Text()),
        sa.Column('version', sa.Integer(), default=1),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.Column('updated_at', sa.DateTime(timezone=True), onupdate=sa.text('now()')),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['generated_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )

    # diary_entries
    op.create_table('diary_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('case_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('created_by_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('entry_type', sa.Enum(
            'fir_registered','ai_analysis','evidence_upload','witness_statement',
            'arrest','court_submission','document_generated','note','status_change',
            name='diaryentrytype'), nullable=False),
        sa.Column('title', sa.String(300), nullable=False),
        sa.Column('description', sa.Text()),
        sa.Column('metadata', postgresql.JSONB(), default=dict),
        sa.Column('is_automated', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['case_id'], ['cases.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['created_by_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_diary_case', 'diary_entries', ['case_id','created_at'])

    # audit_logs
    op.create_table('audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True)),
        sa.Column('user_badge', sa.String(50)),
        sa.Column('user_name', sa.String(150)),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('resource_type', sa.String(50)),
        sa.Column('resource_id', sa.String(100)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.String(300)),
        sa.Column('request_method', sa.String(10)),
        sa.Column('request_path', sa.String(500)),
        sa.Column('success', sa.Boolean(), default=True),
        sa.Column('error_detail', sa.Text()),
        sa.Column('extra_data', postgresql.JSONB(), default=dict),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_audit_user',    'audit_logs', ['user_id'])
    op.create_index('ix_audit_action',  'audit_logs', ['action'])
    op.create_index('ix_audit_created', 'audit_logs', ['created_at'])

    # notifications
    op.create_table('notifications',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('body', sa.Text(), nullable=False),
        sa.Column('notification_type', sa.String(50)),
        sa.Column('related_case_id', postgresql.UUID(as_uuid=True)),
        sa.Column('is_read', sa.Boolean(), default=False),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()')),
        sa.ForeignKeyConstraint(['user_id'], ['users.id']),
        sa.ForeignKeyConstraint(['related_case_id'], ['cases.id']),
        sa.PrimaryKeyConstraint('id'),
    )


def downgrade() -> None:
    op.drop_table('notifications')
    op.drop_table('audit_logs')
    op.drop_table('diary_entries')
    op.drop_table('documents')
    op.drop_table('evidence')
    op.drop_table('cases')
    op.drop_table('users')

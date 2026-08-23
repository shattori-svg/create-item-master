--
-- PostgreSQL database dump
--

\restrict 8KtX0Jn28CpZcY3IlZeI9VoJnxc7ezphuuWwuIypvs5KWmLPOXu0NjdcMm9DytH

-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.3

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA public;


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS 'standard public schema';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: group_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.group_master (
    product_group_code character varying NOT NULL,
    description character varying NOT NULL,
    description_tha character varying DEFAULT ''::character varying,
    description_jpn character varying DEFAULT ''::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: operation_log; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.operation_log (
    id bigint NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    username text,
    user_display_name text,
    action text NOT NULL,
    dept text,
    item_count integer,
    filename text,
    details jsonb,
    storage_path text
);


--
-- Name: COLUMN operation_log.storage_path; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.operation_log.storage_path IS 'GCS object path under GCS_EXPORTS_BUCKET. NULL means the file was not retained (legacy rows or upload failure).';


--
-- Name: operation_log_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.operation_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: operation_log_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.operation_log_id_seq OWNED BY public.operation_log.id;


--
-- Name: store_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.store_master (
    store_code text NOT NULL,
    store_name text NOT NULL,
    store_name_eng text,
    active boolean DEFAULT true
);


--
-- Name: supplier_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.supplier_master (
    supplier_no character varying NOT NULL,
    abbreviation character varying DEFAULT ''::character varying,
    name_eng character varying DEFAULT ''::character varying,
    name_tha character varying DEFAULT ''::character varying,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: user_master; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_master (
    id bigint NOT NULL,
    username text NOT NULL,
    display_name text DEFAULT ''::text,
    role text DEFAULT 'user'::text,
    allowed_departments text[] DEFAULT '{}'::text[],
    preferred_store text DEFAULT ''::text,
    preferred_department text DEFAULT ''::text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    entra_oid text,
    CONSTRAINT user_master_role_check CHECK ((role = ANY (ARRAY['admin'::text, 'user'::text])))
);


--
-- Name: COLUMN user_master.entra_oid; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.user_master.entra_oid IS 'Entra ID object id (oid claim; sub when oid is absent). Immutable per user per tenant — the primary account-matching key. NULL until the user logs in once after this migration.';


--
-- Name: user_master_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_master_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_master_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_master_id_seq OWNED BY public.user_master.id;


--
-- Name: operation_log id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_log ALTER COLUMN id SET DEFAULT nextval('public.operation_log_id_seq'::regclass);


--
-- Name: user_master id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_master ALTER COLUMN id SET DEFAULT nextval('public.user_master_id_seq'::regclass);


--
-- Name: group_master group_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.group_master
    ADD CONSTRAINT group_master_pkey PRIMARY KEY (product_group_code);


--
-- Name: operation_log operation_log_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.operation_log
    ADD CONSTRAINT operation_log_pkey PRIMARY KEY (id);


--
-- Name: store_master store_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.store_master
    ADD CONSTRAINT store_master_pkey PRIMARY KEY (store_code);


--
-- Name: supplier_master supplier_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.supplier_master
    ADD CONSTRAINT supplier_master_pkey PRIMARY KEY (supplier_no);


--
-- Name: user_master user_master_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_master
    ADD CONSTRAINT user_master_pkey PRIMARY KEY (id);


--
-- Name: user_master user_master_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_master
    ADD CONSTRAINT user_master_username_key UNIQUE (username);


--
-- Name: user_master_entra_oid_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_master_entra_oid_key ON public.user_master USING btree (entra_oid) WHERE (entra_oid IS NOT NULL);


--
-- PostgreSQL database dump complete
--

\unrestrict 8KtX0Jn28CpZcY3IlZeI9VoJnxc7ezphuuWwuIypvs5KWmLPOXu0NjdcMm9DytH


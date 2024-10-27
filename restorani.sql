--
-- PostgreSQL database dump
--

-- Dumped from database version 16.2
-- Dumped by pg_dump version 16.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: popularna_jela; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.popularna_jela (
    restoran_id integer,
    naziv_jela character varying(100) NOT NULL,
    cijena numeric(10,2)
);


ALTER TABLE public.popularna_jela OWNER TO postgres;

--
-- Name: restorani; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.restorani (
    id integer NOT NULL,
    ime character varying(100) NOT NULL,
    tip_kuhinje character varying(100) NOT NULL,
    lokacija character varying(200) NOT NULL,
    radno_vrijeme character varying(20),
    broj_sjedecih_mjesta integer,
    prosjecna_ocjena double precision,
    cjenovni_rang character varying(20),
    mogucnost_dostave boolean,
    godina_otvaranja integer,
    CONSTRAINT restorani_prosjecna_ocjena_check CHECK (((prosjecna_ocjena >= (1)::double precision) AND (prosjecna_ocjena <= (5)::double precision)))
);


ALTER TABLE public.restorani OWNER TO postgres;

--
-- Name: restorani_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.restorani_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.restorani_id_seq OWNER TO postgres;

--
-- Name: restorani_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.restorani_id_seq OWNED BY public.restorani.id;


--
-- Name: restorani id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restorani ALTER COLUMN id SET DEFAULT nextval('public.restorani_id_seq'::regclass);


--
-- Data for Name: popularna_jela; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.popularna_jela (restoran_id, naziv_jela, cijena) FROM stdin;
2	Štrukli sa sirom	6.50
2	Štrukli s tartufima	7.50
2	Slatki štrukli s borovnicama	7.00
2	Slatki štrukli s jabukama i cimetom	6.50
2	Slatki štrukli s orasima i medom	7.00
1	Pašticada s makarunima	25.00
1	Fritaja od pršuta s divljim šparogama	12.00
3	ManO2 steak	48.00
3	Jelen	63.00
3	Wagyu kiwami	80.00
4	Panco calamari	17.00
4	Crumbs pistachio sseabass	32.00
4	Crni bakalar u saiko arančinom umaku	50.00
4	Nikkei losos	30.00
5	Curry od piletine	12.50
5	Kothu s piletinom	12.00
5	Kiri malu	12.50
6	Tacos kozica	11.00
6	El Toro ceviche kozice	19.00
6	Wagyu ribeye	33.00
6	Beef wellington	295.00
7	Gulaš od vepra i gljiva s njokima od brašna bučinih sjemenki	24.00
7	Biftek s umakom od crnog vina i tartufa	40.00
7	Domaći zagorski štrukli	11.00
8	Sporo kuhani bikovi obraz	28.00
8	Povrtni rižoto s mascarponeom	19.00
8	Zapečena guščja jetra	28.00
9	Poširani list s mousseom od limunske trave	45.00
9	Kozlić	49.00
9	Wagyu Entrecôte no. 4	63.00
10	Margherita	8.00
10	Napolitana	10.00
10	Capricciosa	12.00
10	Lasagna	15.00
\.


--
-- Data for Name: restorani; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.restorani (id, ime, tip_kuhinje, lokacija, radno_vrijeme, broj_sjedecih_mjesta, prosjecna_ocjena, cjenovni_rang, mogucnost_dostave, godina_otvaranja) FROM stdin;
1	Konoba Mate	tradicionalna	Pupnat 28, Korčula	12:00 - 23:00	50	4.7	$$	f	2000
2	La Štruk	tradicionalna	Skalinska 5, Zagreb	11:00 - 22:00	30	4.5	$	t	2013
3	ManO2	steakhouse	Radnička 50, Zagreb	12:00 - 01:00	70	4.6	$$$	f	2012
4	Takenoko	japansko-peruanska	Preradovićeva ulica 22, Zagreb	12:00 - 00:00	100	4.6	$$$	t	2000
5	Curry Bowl	šrilankanska	Vlaška ulica 44, Zagreb	11:00 - 22:00	50	4.7	$	t	2015
6	El Toro	steakhouse, latinoamerička	Ulica fra Filipa Grabovca 1, Zagreb	12:00 - 01:00	80	4.7	$$	t	2017
7	Vinodol	tradicionalona	Nikole Tesle 10, Zagreb	12:00 - 00:00	130	4.5	$$	f	2000
8	Pantarul	moderna	Kralja Tomislava 1, Dubrovnik	12:00 - 00:00	60	4.8	$$	f	2014
9	Zinfandel's	mediteranska, moderna	Mihanovićeva 1, Zagreb 	06:30 - 23:00	80	4.7	$$$	f	2004
10	L'oro Di Napoli	talijanska, napuljske pizze	Tkalčićeva ulica 70, Zagreb	12:00 - 22:30	80	4.4	$$	t	2018
\.


--
-- Name: restorani_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.restorani_id_seq', 10, true);


--
-- Name: restorani restorani_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.restorani
    ADD CONSTRAINT restorani_pkey PRIMARY KEY (id);


--
-- Name: popularna_jela popularna_jela_restoran_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.popularna_jela
    ADD CONSTRAINT popularna_jela_restoran_id_fkey FOREIGN KEY (restoran_id) REFERENCES public.restorani(id);


--
-- PostgreSQL database dump complete
--


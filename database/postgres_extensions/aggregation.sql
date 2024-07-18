-- Create a function that always returns the first non-NULL item
CREATE OR REPLACE FUNCTION public.first_agg ( anyelement, anyelement )
RETURNS anyelement LANGUAGE SQL IMMUTABLE STRICT AS $$
        SELECT $1;
$$;
 
-- And then wrap an aggregate around it
CREATE AGGREGATE public.FIRST (
        sfunc    = public.first_agg,
        basetype = anyelement,
        stype    = anyelement
);
 
-- Create a function that always returns the last non-NULL item
CREATE OR REPLACE FUNCTION public.last_agg ( anyelement, anyelement )
RETURNS anyelement LANGUAGE SQL IMMUTABLE STRICT AS $$
        SELECT $2;
$$;
 
-- And then wrap an aggregate around it
CREATE AGGREGATE public.LAST (
        sfunc    = public.last_agg,
        basetype = anyelement,
        stype    = anyelement
);

CREATE OR REPLACE FUNCTION public.demo_cohort_select_a_agg( anyarray, integer, anyelement )
RETURNS anyarray LANGUAGE SQL AS $$
    SELECT 
        CASE WHEN $2=1 THEN array_append($1,$3)
        ELSE $1
        END
$$;

DROP AGGREGATE IF EXISTS public.demo_cohort_select_a(integer, anyelement);
CREATE AGGREGATE public.demo_cohort_select_a(integer, anyelement)(
    sfunc    = public.demo_cohort_select_a_agg,
    finalfunc    = array_to_json,
    stype    = anyarray,
    initcond = '{}'
);

CREATE OR REPLACE FUNCTION public.demo_cohort_select_b_agg( anyarray, integer, anyelement )
RETURNS anyarray LANGUAGE SQL AS $$
    SELECT 
        CASE WHEN $2=2 THEN array_append($1,$3)
        ELSE $1
        END
$$;

DROP AGGREGATE IF EXISTS public.demo_cohort_select_b(integer, anyelement);
CREATE AGGREGATE public.demo_cohort_select_b(integer, anyelement)(
    sfunc    = public.demo_cohort_select_b_agg,
    finalfunc    = array_to_json,
    stype    = anyarray,
    initcond = '{}'
);

CREATE OR REPLACE FUNCTION public.demo_cohort_select_c_agg( anyarray, integer, anyelement )
RETURNS anyarray LANGUAGE SQL AS $$
    SELECT 
        CASE WHEN $2=3 THEN array_append($1,$3)
        ELSE $1
        END
$$;

DROP AGGREGATE IF EXISTS public.demo_cohort_select_c(integer, anyelement);
CREATE AGGREGATE public.demo_cohort_select_c(integer, anyelement)(
    sfunc    = public.demo_cohort_select_c_agg,
    finalfunc    = array_to_json,
    stype    = anyarray,
    initcond = '{}'
);

CREATE OR REPLACE FUNCTION public.demo_cohort_select_d_agg( anyarray, integer, anyelement )
RETURNS anyarray LANGUAGE SQL AS $$
    SELECT 
        CASE WHEN $2=4 THEN array_append($1,$3)
        ELSE $1
        END
$$;

DROP AGGREGATE IF EXISTS public.demo_cohort_select_d(integer, anyelement);
CREATE AGGREGATE public.demo_cohort_select_d(integer, anyelement)(
    sfunc    = public.demo_cohort_select_d_agg,
    finalfunc    = array_to_json,
    stype    = anyarray,
    initcond = '{}'
);

CREATE OR REPLACE FUNCTION public.demo_cohort_select_e_agg( anyarray, integer, anyelement )
RETURNS anyarray LANGUAGE SQL AS $$
    SELECT 
        CASE WHEN $2=5 THEN array_append($1,$3)
        ELSE $1
        END
$$;

DROP AGGREGATE IF EXISTS public.demo_cohort_select_e(integer, anyelement);
CREATE AGGREGATE public.demo_cohort_select_e(integer, anyelement)(
    sfunc    = public.demo_cohort_select_e_agg,
    finalfunc    = array_to_json,
    stype    = anyarray,
    initcond = '{}'
);
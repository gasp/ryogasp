#!/usr/bin/env bash
# Smoke test for the ryogasp.com container.
#   bash scripts/smoke.sh [base_url]      (default: http://localhost:9000)
# Exits non-zero if a check fails. Expectations were recorded on the previous Apache setup;
# the only deliberate differences are noted inline.
set -u
BASE="${1:-http://localhost:9000}"; BASE="${BASE%/}"
export LC_ALL=C
n=0; fail=0

# check PATH STATUS [content-type-prefix] [body-substring] [location-substring]
check() {
	local path="$1" want="$2" ctype="${3:-}" body="${4:-}" loc="${5:-}"
	local tmp meta code rest ct redir err=""
	tmp=$(mktemp)
	meta=$(curl -s --globoff --max-time 90 -o "$tmp" -w '%{http_code}|%{content_type}|%{redirect_url}' "$BASE$path")
	code="${meta%%|*}"; rest="${meta#*|}"; ct="${rest%%|*}"; redir="${rest#*|}"
	[[ "$code" == "$want" ]]                        || err+=" status=$code (want $want)"
	[[ -z "$ctype" || "$ct" == "$ctype"* ]]         || err+=" type=$ct (want $ctype*)"
	[[ -z "$body" ]] || grep -q -- "$body" "$tmp"   || err+=" body lacks '$body'"
	[[ -z "$loc" || "$redir" == *"$loc"* ]]         || err+=" location=$redir (want *$loc*)"
	rm -f "$tmp"; n=$((n + 1))
	if [[ -z "$err" ]]; then
		printf 'ok    %-56s %s\n' "$path" "$code"
	else
		printf 'FAIL  %-56s%s\n' "$path" "$err"; fail=$((fail + 1))
	fi
}

echo "== $BASE"
# pages
check /                                        200 text/html '<title>ryogasp.com</title>'
check /plan                                    200 text/html 'plan du site'
check /activite                                200 text/html
check /miniblog                                200 text/html 'mini-blog'
check /a-propos/                               200 text/html 'a propos'
check /a-propos/article/liquider               200 text/html 'Liquider'
check /a-propos/breve/mini-blog                200 text/html 'Mini-blog'
check '/spip.php?page=sommaire'                200 text/html '<title>ryogasp.com</title>'
check '/spip.php?page=plan&var_mode=recalcul'  200 text/html 'plan du site'
# custom rewrites (rss, archives)
check /rss                                     200 text/xml '<rss'
check /blog/rss                                200 text/xml '<rss'
check /gameover/rss.php                        200 text/xml '<rss'
check /blog/archives/2010-01                   200 text/html 'janvier 2010'
check /blog/archives/2010-01-15                200 text/html '15 janvier 2010'
check /gameover/archives/2012-03               200 text/html 'mars 2012'
# standard files served by SPIP templates
check /robots.txt                              200 text/plain 'User-agent'
check /humans.txt                              200 text/plain
check /favicon.ico                             200 image/
check /sitemap.xml                             200 text/xml
# html compat + ping redirects (done by SPIP)
check /article1.html                           301 '' '' /blog/carnet-de-bord/article/bonne-annee
check /1                                       301 '' '' /blog/carnet-de-bord/article/bonne-annee
check /rubrique21                              301 '' '' /gameover/
# old sites
check /babel                                   302 '' '' babel.ryogasp.com
check /ryoga/foo                               301 '' '' archives.ryogasp.com/ryoga/
# admin
check /ecrire/                                 302 '' '' page=login
# errors
check /this-page-does-not-exist                200 text/html 'ryogasp-404'
check /missing-file.jpg                        404 text/html 'ryogasp-404'
check /missing.php                             404 text/html 'ryogasp-404'
check /config/connect.php                      403 text/html 'ryogasp-403'
check /tmp/meta_cache.php                      403 text/html 'ryogasp-403'
check /vendor/autoload.php                     403 text/html 'ryogasp-403'
check /.git/config                             403 text/html 'ryogasp-403'
check /composer.json                           404 text/html 'ryogasp-404'   # was 200 on Apache; SPIP 4.4 htaccess.txt blocks it
# documents (hash_documents plugin) and thumbnails
check /IMG/does-not-exist.jpg                  200 text/html '404 Not Found'
check /IMG/jpg/a/2/a/161012_reggie_nx.jpg      200 image/jpeg
check /IMG/jpg/161012_reggie_nx.jpg            301 '' '' /IMG/jpg/a/2/a/161012_reggie_nx.jpg
check /local/cache-vignettes/L10xH6/scaphavignon-83037.jpg 200 image/jpeg
check /local/cache-vignettes/L1xH1/missing.jpg 404 text/html 'ryogasp-404'
# static assets
check /squelettes/css/journal/style.css        200 text/css
check /squelettes/favicon.svg                  200 image/svg+xml
check /prive/javascript/jquery.js              200

echo "== $((n - fail))/$n checks passed"
exit $(( fail > 0 ))

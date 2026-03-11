#!/usr/bin/env bash
set -euo pipefail

if ! command -v curl >/dev/null 2>&1; then
  echo "curl is required" >&2
  exit 1
fi

if ! command -v jq >/dev/null 2>&1; then
  echo "jq is required" >&2
  exit 1
fi

CF_SHARED_ENV_FILE="${CF_SHARED_ENV_FILE:-${HOME}/.config/cloudflare/api.env}"

if [[ -f "${CF_SHARED_ENV_FILE}" ]]; then
  # shellcheck disable=SC1090
  source "${CF_SHARED_ENV_FILE}"
fi

require_env() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "Missing required env var: ${name}" >&2
    exit 1
  fi
}

CF_ZONE_NAME="${CF_ZONE_NAME:-talkaris.com}"
CF_ORIGIN_IPV4="${CF_ORIGIN_IPV4:-109.123.248.164}"
CF_WWW_HOST="${CF_WWW_HOST:-www.${CF_ZONE_NAME}}"
CF_SSL_MODE="${CF_SSL_MODE:-strict}"
CF_PURGE_CACHE="${CF_PURGE_CACHE:-true}"

cf_api() {
  local method="$1"
  local path="$2"
  local body="${3:-}"
  local response
  local -a auth_headers

  if [[ -n "${CF_API_TOKEN:-}" ]]; then
    auth_headers=(-H "Authorization: Bearer ${CF_API_TOKEN}")
  else
    require_env CF_AUTH_EMAIL
    require_env CF_GLOBAL_API_KEY
    auth_headers=(-H "X-Auth-Email: ${CF_AUTH_EMAIL}" -H "X-Auth-Key: ${CF_GLOBAL_API_KEY}")
  fi

  if [[ -n "${body}" ]]; then
    response="$(curl -sS -X "${method}" "https://api.cloudflare.com/client/v4/${path}" \
      "${auth_headers[@]}" \
      -H "Content-Type: application/json" \
      --data "${body}")"
  else
    response="$(curl -sS -X "${method}" "https://api.cloudflare.com/client/v4/${path}" \
      "${auth_headers[@]}" \
      -H "Content-Type: application/json")"
  fi

  if ! jq -e '.success == true' >/dev/null 2>&1 <<<"${response}"; then
    printf '%s\n' "${response}" >&2
    exit 1
  fi

  printf '%s\n' "${response}"
}

upsert_a_record() {
  local zone_id="$1"
  local name="$2"
  local ip="$3"
  local payload
  local lookup
  local record_id

  payload="$(jq -cn \
    --arg type "A" \
    --arg name "${name}" \
    --arg content "${ip}" \
    --argjson proxied true \
    --argjson ttl 1 \
    '{type: $type, name: $name, content: $content, proxied: $proxied, ttl: $ttl}')"

  lookup="$(cf_api GET "zones/${zone_id}/dns_records?type=A&name=${name}")"
  record_id="$(jq -r '.result[0].id // empty' <<<"${lookup}")"

  if [[ -n "${record_id}" ]]; then
    cf_api PUT "zones/${zone_id}/dns_records/${record_id}" "${payload}" >/dev/null
    echo "Updated A ${name} -> ${ip}"
  else
    cf_api POST "zones/${zone_id}/dns_records" "${payload}" >/dev/null
    echo "Created A ${name} -> ${ip}"
  fi
}

if [[ -n "${CF_API_TOKEN:-}" ]]; then
  echo "Verifying Cloudflare token"
  cf_api GET "user/tokens/verify" >/dev/null
else
  echo "Verifying Cloudflare global API key"
  cf_api GET "zones?name=${CF_ZONE_NAME}" >/dev/null
fi

echo "Resolving zone id for ${CF_ZONE_NAME}"
ZONE_JSON="$(cf_api GET "zones?name=${CF_ZONE_NAME}")"
ZONE_ID="$(jq -r '.result[0].id // empty' <<<"${ZONE_JSON}")"

if [[ -z "${ZONE_ID}" ]]; then
  echo "Cloudflare zone not found: ${CF_ZONE_NAME}" >&2
  exit 1
fi

echo "Using zone ${ZONE_ID}"

upsert_a_record "${ZONE_ID}" "${CF_ZONE_NAME}" "${CF_ORIGIN_IPV4}"
upsert_a_record "${ZONE_ID}" "${CF_WWW_HOST}" "${CF_ORIGIN_IPV4}"

echo "Setting SSL mode to ${CF_SSL_MODE}"
cf_api PATCH "zones/${ZONE_ID}/settings/ssl" "$(jq -cn --arg value "${CF_SSL_MODE}" '{value: $value}')" >/dev/null

if [[ "${CF_PURGE_CACHE}" == "true" ]]; then
  echo "Purging Cloudflare cache"
  cf_api POST "zones/${ZONE_ID}/purge_cache" '{"purge_everything":true}' >/dev/null
fi

echo "Cloudflare cutover completed for ${CF_ZONE_NAME}"

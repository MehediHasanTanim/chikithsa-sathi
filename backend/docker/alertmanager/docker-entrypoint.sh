#!/bin/sh
set -eu

if [ -n "${ALERT_WEBHOOK_URL_FILE:-}" ] && [ -r "$ALERT_WEBHOOK_URL_FILE" ]; then
  ALERT_WEBHOOK_URL=$(cat "$ALERT_WEBHOOK_URL_FILE")
fi

if [ -z "${ALERT_WEBHOOK_URL:-}" ]; then
  echo 'ALERT_WEBHOOK_URL must be configured for Alertmanager' >&2
  exit 1
fi

case "$ALERT_WEBHOOK_URL" in
  https://*) ;;
  *)
    echo 'ALERT_WEBHOOK_URL must use HTTPS' >&2
    exit 1
    ;;
esac

escaped_url=$(printf '%s' "$ALERT_WEBHOOK_URL" | sed 's/[&|]/\\&/g')
sed "s|__ALERT_WEBHOOK_URL__|$escaped_url|g" \
  /etc/alertmanager/alertmanager.yml.template > /tmp/alertmanager.yml
exec /bin/alertmanager --config.file=/tmp/alertmanager.yml "$@"

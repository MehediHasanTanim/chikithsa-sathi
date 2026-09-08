FROM prom/alertmanager:v0.28.1

COPY alertmanager.yml.template /etc/alertmanager/alertmanager.yml.template
COPY docker-entrypoint.sh /usr/local/bin/alertmanager-entrypoint

USER root
RUN chmod 0555 /usr/local/bin/alertmanager-entrypoint
USER nobody

ENTRYPOINT ["/usr/local/bin/alertmanager-entrypoint"]
CMD ["--storage.path=/alertmanager"]

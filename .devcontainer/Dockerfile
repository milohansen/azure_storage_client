ARG VARIANT=bullseye
FROM --platform=linux/amd64 mcr.microsoft.com/vscode/devcontainers/base:0-${VARIANT}

RUN curl -Lo "/tmp/deno.zip" "https://github.com/denoland/deno/releases/download/v1.26.1/deno-x86_64-unknown-linux-gnu.zip" \
    && unzip -d /usr/local/bin /tmp/deno.zip

ENV PATH /home/vscode/.deno/bin:/usr/local/bin:$PATH

RUN sudo -u vscode deno install -fA https://deno.land/x/beako_cli/beako.ts
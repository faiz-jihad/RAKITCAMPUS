FROM php:8.4-fpm-alpine

# Install extension installer
COPY --from=mlocati/php-extension-installer:latest /usr/bin/install-php-extensions /usr/local/bin/

# Install PHP extensions fast
RUN install-php-extensions pdo_mysql mbstring zip bcmath exif pcntl gd

# Install tools, nodejs, npm, git
RUN apk add --no-cache git curl nodejs npm bash

# Install composer
COPY --from=composer:2 /usr/bin/composer /usr/local/bin/composer

WORKDIR /var/www

EXPOSE 9000
CMD ["php-fpm"]

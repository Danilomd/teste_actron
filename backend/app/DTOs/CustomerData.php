<?php

declare(strict_types=1);

namespace App\DTOs;

use Illuminate\Support\Str;

readonly class CustomerData
{
    public string $name;

    public string $email;

    public ?string $cpf;

    public function __construct(
        string $name,
        string $email,
        ?string $cpf = null,
    ) {
        $this->name = trim($name);
        $this->email = Str::lower(trim($email));

        $normalizedCpf = $cpf !== null ? trim($cpf) : null;
        $this->cpf = $normalizedCpf !== '' ? $normalizedCpf : null;
    }
}

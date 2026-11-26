<?php

namespace Database\Factories;

use App\Models\Customer;
use App\Models\Purchase;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Purchase>
 */
class PurchaseFactory extends Factory
{
    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'customer_id' => Customer::factory(),
            'reference_code' => strtoupper(fake()->unique()->bothify('PUR-####-????')),
            'discount' => fake()->randomFloat(2, 0, 50),
            'total_amount' => fake()->randomFloat(2, 50, 1500),
            'purchased_at' => fake()->dateTimeBetween('-30 days', 'now'),
            'notes' => fake()->optional()->sentence(),
        ];
    }
}

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('subscriptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tenant_id');
            $table->uuid('plan_id');
            $table->enum('status', ['active', 'pending', 'expired', 'cancelled', 'trial'])->default('active');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('payment_method', ['credit_card', 'pix', 'boleto'])->nullable();
            $table->string('mercadopago_subscription_id')->nullable();
            $table->string('mercadopago_preapproval_id')->nullable();
            $table->boolean('is_trial')->default(false);
            $table->date('trial_ends_at')->nullable();
            $table->decimal('amount_due', 10, 2)->default(0);
            $table->date('last_payment_date')->nullable();
            $table->date('next_billing_date')->nullable();
            $table->boolean('notified_expiring')->default(false);
            $table->timestamps();

            $table->foreign('tenant_id')->references('id')->on('tenants')->onDelete('cascade');
            $table->foreign('plan_id')->references('id')->on('plans');
            $table->index('tenant_id');
            $table->index('status');
            $table->index('end_date');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
    }
};

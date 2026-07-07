<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->unsignedInteger('sequence')->nullable()->after('id');
        });

        $seq = 0;
        DB::table('users')->orderBy('id')->get(['id'])->each(function ($row) use (&$seq) {
            $seq++;
            DB::table('users')->where('id', $row->id)->update(['sequence' => $seq]);
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('sequence');
        });
    }
};

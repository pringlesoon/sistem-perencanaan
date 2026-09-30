<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes — SAPT Single Page Application Entry
|--------------------------------------------------------------------------
*/

Route::get('/{any}', function () {
    return view('app');
})->where('any', '.*');
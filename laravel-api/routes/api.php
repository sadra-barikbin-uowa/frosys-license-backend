<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BadgeController;
use App\Http\Controllers\Api\DriverController;
use App\Http\Controllers\Api\EmployeeController;
use App\Http\Controllers\Api\SystemSettingController;
use App\Http\Controllers\Api\VehicleController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/settings', [SystemSettingController::class, 'show']);
    Route::put('/settings', [SystemSettingController::class, 'update']);

    Route::apiResource('employees', EmployeeController::class)
        ->middleware('can:users.manage');

    Route::get('/drivers', [DriverController::class, 'index'])->middleware('can:drivers.view');
    Route::post('/drivers', [DriverController::class, 'store'])->middleware('can:drivers.create');
    Route::get('/drivers/{driver}', [DriverController::class, 'show'])->middleware('can:drivers.view');
    Route::match(['put', 'patch'], '/drivers/{driver}', [DriverController::class, 'update'])->middleware('can:drivers.edit');
    Route::delete('/drivers/{driver}', [DriverController::class, 'destroy'])->middleware('can:drivers.delete');

    Route::get('/vehicles', [VehicleController::class, 'index'])->middleware('can:vehicles.view');
    Route::post('/vehicles', [VehicleController::class, 'store'])->middleware('can:vehicles.manage');
    Route::get('/vehicles/{vehicle}', [VehicleController::class, 'show'])->middleware('can:vehicles.view');
    Route::match(['put', 'patch'], '/vehicles/{vehicle}', [VehicleController::class, 'update'])->middleware('can:vehicles.manage');
    Route::delete('/vehicles/{vehicle}', [VehicleController::class, 'destroy'])->middleware('can:vehicles.manage');

    Route::get('/badges', [BadgeController::class, 'index'])->middleware('can:badges.view');
    Route::post('/badges', [BadgeController::class, 'store'])->middleware('can:badges.create');
    Route::post('/badges/{badge}/print', [BadgeController::class, 'authorizePrint'])->middleware('can:badges.print');
    Route::get('/badges/{badge}', [BadgeController::class, 'show'])->middleware('can:badges.view');
    Route::match(['put', 'patch'], '/badges/{badge}', [BadgeController::class, 'update'])->middleware('can:badges.edit');
    Route::delete('/badges/{badge}', [BadgeController::class, 'destroy'])->middleware('can:badges.delete');
});

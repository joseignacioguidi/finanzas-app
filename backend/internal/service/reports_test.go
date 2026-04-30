package service_test

import (
	"testing"

	"github.com/joseguidi/expense-tracker/backend/internal/service"
)

func TestCalculateSavingsRate(t *testing.T) {
	tests := []struct {
		name    string
		income  float64
		expense float64
		want    float64
	}{
		{"ahorro del 40%", 100000, 60000, 40.0},
		{"sin ahorro exacto", 50000, 50000, 0.0},
		{"déficit", 30000, 50000, -66.67},
		{"sin ingresos", 0, 50000, 0.0},
		{"ahorro completo", 10000, 0, 100.0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.CalculateSavingsRate(tt.income, tt.expense)
			if got != tt.want {
				t.Errorf("CalculateSavingsRate(%v, %v) = %v, want %v", tt.income, tt.expense, got, tt.want)
			}
		})
	}
}

func TestCalculateProjection(t *testing.T) {
	tests := []struct {
		name       string
		avgMonthly float64
		months     int
		wantMin    float64
		wantMax    float64
	}{
		{"proyección 6 meses", 10000, 6, 48000.0, 72000.0},
		{"proyección 12 meses", 10000, 12, 96000.0, 144000.0},
		{"ahorro cero", 0, 6, 0.0, 0.0},
		{"ahorro negativo", -5000, 6, -36000.0, -24000.0},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.CalculateProjection(tt.avgMonthly, tt.months)
			if got.Min != tt.wantMin || got.Max != tt.wantMax {
				t.Errorf("CalculateProjection(%v, %v) = {Min:%v, Max:%v}, want {Min:%v, Max:%v}",
					tt.avgMonthly, tt.months, got.Min, got.Max, tt.wantMin, tt.wantMax)
			}
		})
	}
}

func TestCalculateGoalStatus(t *testing.T) {
	tests := []struct {
		name        string
		currentRate float64
		required    float64
		want        service.GoalStatus
	}{
		{"en camino exacto", 10000, 10000, service.GoalStatusOnTrack},
		{"en camino con excedente", 12000, 10000, service.GoalStatusOnTrack},
		{"levemente atrasado 90%", 9000, 10000, service.GoalStatusSlightlyBehind},
		{"límite inferior levemente atrasado", 8000, 10000, service.GoalStatusSlightlyBehind},
		{"muy atrasado 79%", 7900, 10000, service.GoalStatusOffTrack},
		{"sin ahorro", 0, 10000, service.GoalStatusOffTrack},
		{"meta cumplida sin requerimiento", 5000, 0, service.GoalStatusOnTrack},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := service.CalculateGoalStatus(tt.currentRate, tt.required)
			if got != tt.want {
				t.Errorf("CalculateGoalStatus(%v, %v) = %v, want %v", tt.currentRate, tt.required, got, tt.want)
			}
		})
	}
}

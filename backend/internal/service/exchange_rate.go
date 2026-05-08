package service

import (
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"sync"
	"time"
)

type rateEntry struct {
	rate      float64
	fetchedAt time.Time
}

type ExchangeRateService struct {
	mu    sync.Mutex
	cache map[string]rateEntry
}

func NewExchangeRateService() *ExchangeRateService {
	return &ExchangeRateService{cache: make(map[string]rateEntry)}
}

func (s *ExchangeRateService) GetRate(from, to string) (float64, time.Time, error) {
	if from == to {
		return 1, time.Now(), nil
	}

	key := from + ":" + to

	s.mu.Lock()
	entry, cached := s.cache[key]
	s.mu.Unlock()

	if cached && time.Since(entry.fetchedAt) < time.Hour {
		return entry.rate, entry.fetchedAt, nil
	}

	// open.er-api.com soporta ARS y no requiere API key
	url := fmt.Sprintf("https://open.er-api.com/v6/latest/%s", from)
	resp, err := http.Get(url) //nolint:noctx
	if err != nil {
		if cached {
			return entry.rate, entry.fetchedAt, nil
		}
		return 0, time.Time{}, errors.New("no se pudo obtener el tipo de cambio y no hay caché disponible")
	}
	defer resp.Body.Close()

	var result struct {
		Rates map[string]float64 `json:"rates"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		if cached {
			return entry.rate, entry.fetchedAt, nil
		}
		return 0, time.Time{}, errors.New("respuesta inválida de la API de cambio")
	}

	rate, exists := result.Rates[to]
	if !exists {
		return 0, time.Time{}, fmt.Errorf("moneda '%s' no encontrada en la respuesta", to)
	}

	fetchedAt := time.Now()
	s.mu.Lock()
	s.cache[key] = rateEntry{rate: rate, fetchedAt: fetchedAt}
	s.mu.Unlock()

	return rate, fetchedAt, nil
}

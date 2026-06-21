<template>
  <div class="p-4 bg-[#f5f6f8] min-h-screen">
<el-dialog
  v-model="catalogModalVisible"
  title="Połącz z Katalogiem produktów Allegro"
  width="760px"
  :close-on-click-modal="false"
  :close-on-press-escape="false"
  destroy-on-close
>
  <div class="space-y-5">
    <div class="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-4 text-xs text-[#334155] leading-5">
      Najpierw sprawdź, czy produkt istnieje w Katalogu Allegro. Wpisz GTIN / EAN produktu.
      Jeśli Allegro nic nie znajdzie, możesz przejść dalej i dodać nowy produkt ręcznie.
    </div>

    <div>
      <label class="block text-xs font-semibold text-[#64748b] mb-1">
        GTIN / EAN
      </label>

      <div class="flex gap-3">
        <el-input
          v-model="catalogSearchPhrase"
          class="allegro-input"
          placeholder="Wpisz GTIN / EAN"
          @keyup.enter="searchCatalogByGtin"
        />

        <el-button
          color="#ea580c"
          :loading="catalogLoading"
          @click="searchCatalogByGtin"
        >
          Szukaj
        </el-button>
      </div>
    </div>

    <div v-if="catalogProducts.length" class="space-y-3">
      <div
        v-for="item in catalogProducts"
        :key="item.id"
        class="border border-[#e5e7eb] rounded-lg p-4 flex justify-between items-center"
      >
        <div>
          <div class="text-sm font-bold text-[#111827]">
            {{ item.name || item.id }}
          </div>

          <div class="text-xs text-[#64748b] mt-1">
            ID produktu Allegro: {{ item.id }}
          </div>

          <div v-if="item.categoryName || item.categoryId" class="text-xs text-[#64748b] mt-1">
            Kategoria: {{ item.categoryName || item.categoryId }}
          </div>
        </div>

        <el-button color="#00796b" @click="selectCatalogProduct(item)">
          Wybierz
        </el-button>
      </div>
    </div>

    <el-empty
      v-if="catalogSearched && !catalogLoading && !catalogProducts.length"
      description="Nie znaleziono produktu w Katalogu Allegro"
    />

    <div class="flex justify-end gap-3 pt-4 border-t border-[#e5e7eb]">
      <el-button
        v-if="catalogSearched && !catalogProducts.length"
        color="#4f6bed"
        @click="createNewCatalogProduct"
      >
        Dodaj nowy produkt
      </el-button>
    </div>
  </div>
</el-dialog>
    <div class="space-y-4">
      <!-- TYTUŁ -->
      <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
        <h2 class="text-[26px] font-bold text-[#111827] mb-6">
          Tytuł
        </h2>

        <div class="space-y-6">
          <div>
            <label class="block text-xs font-semibold text-[#374151] mb-2">
              Tytuł <span class="text-red-500">*</span>
            </label>

            <el-input
              v-model="form.title"
              maxlength="75"
              show-word-limit
              placeholder="Wpisz tytuł oferty"
              class="allegro-input"
            />

            <p class="mt-2 text-[11px] text-[#64748b] leading-5">
              Nazwij produkt, podając cechy, które pozwolą go rozpoznać.
              Więcej cech wprowadzisz jako parametry.
            </p>
          </div>

          <div>
            <label class="block text-xs font-semibold text-[#374151] mb-2">
              Sygnatura
              <span class="font-normal text-[#94a3b8]">(opcjonalnie)</span>
            </label>

            <el-input
              v-model="form.signature"
              maxlength="100"
              show-word-limit
              placeholder="Twój wewnętrzny identyfikator produktu"
              class="allegro-input"
            />

            <p class="mt-2 text-[11px] text-[#64748b] leading-5">
              Twój wewnętrzny identyfikator produktu widoczny tylko dla Ciebie.
              Możesz po nim wyszukiwać.
            </p>
          </div>
        </div>
      </div>

      <!-- KATEGORIA -->
      <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
        <h2 class="text-[26px] font-bold text-[#111827] mb-6">
          Kategoria
        </h2>

        <div v-if="selectedCategory">
          <div class="flex items-center gap-2 text-xs mb-2">
            <strong class="text-[#111827]">
              {{ selectedCategory.name }}
            </strong>

            <span class="text-[#64748b]">
              Nr kategorii {{ selectedCategory.id }}
            </span>
          </div>

          <div class="text-sm text-[#111827]">
            {{ selectedCategoryPathText }}

            <button
              class="ml-3 text-[#00796b] underline hover:text-[#115e59]"
              type="button"
              @click="openCategoryModal"
            >
              Zmień
            </button>
          </div>
        </div>

        <div v-else>
          <el-button color="#ea580c" @click="openCategoryModal">
            Wybierz kategorię
          </el-button>
        </div>
      </div>

      <!-- PRODUKTY W OFERCIE -->
      <div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
        <h2 class="text-[22px] font-bold text-[#111827] mb-5">
          Produkty w ofercie
        </h2>

        <div class="border border-[#d6dfe9] rounded-lg p-5">
          <div class="border border-[#e5e7eb] border-l-4 border-l-[#facc15] rounded-md p-4 mb-6">
            <div class="flex gap-3">
              <div class="text-[#eab308] text-xl leading-none">
                ⚠
              </div>

              <div>
                <p class="text-xs font-bold text-[#111827]">
                  W tej kategorii wymagamy, aby oferty były połączone z Katalogiem produktów Allegro.
                </p>

                <p class="text-xs text-[#334155] mt-2">
                  Wybierz produkt z Katalogu lub wypełnij parametry w ofercie, aby stworzyć powiązanie.
                </p>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 class="text-lg font-bold text-[#111827] mb-3">
                Nowy produkt
              </h3>
              <button
                class="text-xs font-bold tracking-[0.18em] text-[#00796b] hover:underline mb-8"
                type="button"
                @click="openCatalogModal"
              >
                WYBIERZ PRODUKT Z KATALOGU
              </button>
            </div>
          </div>

          <div class="border-t border-[#e5e7eb] mt-8 pt-6">
            <div v-if="!parameters.length">
              <el-empty description="Wybierz kategorię, aby pobrać parametry" />
            </div>

            <div v-else class="max-w-[460px] space-y-5">
              <div
                v-for="param in visibleParameters"
                :key="param.id"
              >
                <div class="flex items-center gap-2">
                  <div class="flex-1">
                    <label class="block text-xs font-semibold text-[#64748b] mb-1">
                      {{ param.name }}
                      <span v-if="param.required" class="text-red-500">*</span>
                    </label>

                    <el-select
                      v-if="getParamValues(param).length"
                      v-model="form.parameterValues[param.id]"
                      filterable
                      clearable
                      class="!w-full allegro-select"
                      placeholder="wybierz"
                    >
                      <el-option
                        v-for="value in getParamValues(param)"
                        :key="value.id || value.value || value.name"
                        :label="value.name || value.value"
                        :value="value.id || value.value || value.name"
                      />
                    </el-select>

                    <el-input-number
                      v-else-if="isNumberParameter(param)"
                      v-model="form.parameterValues[param.id]"
                      :controls="false"
                      class="!w-full allegro-input-number"
                    />

                    <el-switch
                      v-else-if="isBooleanParameter(param)"
                      v-model="form.parameterValues[param.id]"
                    />

                    <el-input
                      v-else
                      v-model="form.parameterValues[param.id]"
                      class="allegro-input"
                      placeholder="Wpisz wartość"
                    />
                  </div>

                  <el-tooltip content="Parametr wymagany przez Allegro" placement="top">
                    <span class="text-[#64748b] border border-[#94a3b8] rounded-full w-4 h-4 text-[10px] flex items-center justify-center mt-5">
                      ?
                    </span>
                  </el-tooltip>
                </div>
              </div>

              <button
                v-if="parameters.length > 6"
                class="border border-[#00796b] px-4 py-2 text-xs font-bold tracking-[0.18em] text-[#00796b] hover:bg-[#ecfdf5]"
                type="button"
                @click="showAllParameters = !showAllParameters"
              >
                {{ showAllParameters ? 'MNIEJ PARAMETRÓW' : 'WIĘCEJ PARAMETRÓW' }}
              </button>
            </div>
          </div>

          <!-- DANE PRODUCENTA / BEZPIECZEŃSTWO -->
        <!-- DANE PRODUCENTA / BEZPIECZEŃSTWO -->
<div class="border-t border-[#e5e7eb] mt-8 pt-6 max-w-[460px] space-y-7">
  <div>
    <label class="block text-xs font-semibold text-[#64748b] mb-1">
      Dane producenta
    </label>

    <el-select
      v-model="form.responsibleProducerId"
      class="!w-full allegro-select"
      placeholder="wybierz dane producenta"
      clearable
      filterable
      :loading="loadingInitialData"
    >
      <el-option
        v-for="item in responsibleProducers"
        :key="item.id"
        :label="item.name || item.id"
        :value="item.id"
      />
    </el-select>
  </div>
  <div
    v-if="form.responsiblePersonVisible"
    class="border border-[#e5e7eb] rounded-lg p-4 space-y-4"
  >
    <div>
      <label class="block text-xs font-semibold text-[#64748b] mb-1">
        Imię i nazwisko / nazwa podmiotu
      </label>

      <el-input
        v-model="form.responsiblePersonName"
        class="allegro-input"
        placeholder="Wpisz dane osoby odpowiedzialnej"
      />
    </div>

    <div>
      <label class="block text-xs font-semibold text-[#64748b] mb-1">
        E-mail
      </label>

      <el-input
        v-model="form.responsiblePersonEmail"
        class="allegro-input"
        placeholder="Wpisz adres e-mail"
      />
    </div>
  </div>

  <div class="pt-4">
    <label class="block text-xs font-semibold text-[#64748b] mb-1">
      Informacje o bezpieczeństwie
    </label>

    <el-select
      v-model="form.safetyInformation"
      class="!w-full allegro-select"
      placeholder="wybierz"
      clearable
      @change="onSafetyInformationChange"
    >
      <el-option label="Informacje o bezpieczeństwie" value="safetyInformation" />
      <el-option label="Ustaw tekst" value="customText" />
    </el-select>

    <div
      v-if="form.safetyInformation === 'customText'"
      class="mt-5"
    >
      <el-input
        v-model="form.safetyText"
        type="textarea"
        maxlength="5000"
        show-word-limit
        :rows="7"
        placeholder="Treść informacji o bezpieczeństwie"
        class="allegro-textarea"
      />
    </div>
  </div>
</div>
          </div>
        </div>
      </div>

      <!-- ZDJĘCIA I OPIS -->
      <AllegroPhotosAndDescription
        v-model:photos="form.photos"
        v-model:descriptionRows="form.descriptionRows"
        @generate-rewrite-ai="openDescriptionRewriteModal"
      />

<!-- UWAGI DO ZAKUPU -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-4">
    Uwagi do zakupu (wiadomość dla sprzedającego)
  </h2>

  <p class="text-[11px] text-[#64748b] leading-5 mb-5">
    Jeśli dodatkowe informacje od kupujących są niezbędne do realizacji zamówienia,
    możesz dodać miejsce na wiadomość do Ciebie z dodatkowym komunikatem i instrukcją.
    Kupujący zobaczy ją w momencie finalizacji zamówienia.
  </p>

  <el-radio-group
  v-model="form.purchaseNotesOption"
  class="flex flex-col gap-4"
>
  <el-radio label="OPTIONAL">
    <span class="text-xs text-[#111827]">
      Na wszelki wypadek pozostawiam możliwość dodania uwag do zakupu -
      wybieram opcjonalne pole “uwagi do zakupu”.
    </span>
  </el-radio>

  <el-radio label="NONE">
    <span class="text-xs text-[#111827]">
      Nie potrzebuję żadnych informacji - wybieram brak pola “uwagi do zakupu”.
    </span>
  </el-radio>
</el-radio-group>
</div>
<!-- DOSTAWA I PŁATNOŚĆ -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-5">
    Dostawa i płatność
  </h2>

  <div class="max-w-[560px] space-y-6">
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-4">
        Dostawa
      </h3>

      <label class="block text-[11px] font-semibold text-[#475569] mb-2 uppercase">
        Cennik dostawy
      </label>

          <el-select
            v-model="form.deliveryPriceListId"
            class="!w-full allegro-select"
            placeholder="wybierz"
            clearable
          >
          <el-option
            v-for="item in deliveryPriceLists"
            :key="item.id"
            :label="item.name || item.id"
            :value="item.id"
          />
          </el-select>

      <p class="mt-2 text-[11px] text-[#111827]">
        Jeśli nie masz odpowiedniego cennika -
        <button
          type="button"
          class="text-[#00796b] underline"
        >
          dodaj cennik dostawy
        </button>.
      </p>

      <div class="mt-5 bg-[#f8fafc] px-4 py-4 flex gap-3 text-[12px] text-[#111827] leading-5">
        <span class="text-[#2563eb]">ⓘ</span>
        <p>
          Wybierz cennik dostawy, aby zobaczyć rynki, na które będzie możliwa dostawa oferty,
          jeśli spełni ona wszystkie warunki sprzedaży.
        </p>
      </div>
    </div>

    <div>
      <label class="block text-[11px] font-semibold text-[#475569] mb-2 uppercase">
        Czas wysyłki
      </label>

      <el-select
        v-model="form.shippingTime"
        class="!w-full allegro-select"
        placeholder="wybierz"
      >
        <el-option label="1 dzień" value="PT24H" />
        <el-option label="2 dni" value="PT48H" />
        <el-option label="3 dni" value="PT72H" />
        <el-option label="5 dni" value="PT120H" />
        <el-option label="7 dni" value="PT168H" />
      </el-select>

      <div class="mt-3">
        <el-checkbox v-model="form.isPresale">
          <span class="text-xs text-[#111827]">
            przedmiot jest w przedsprzedaży
          </span>
        </el-checkbox>
      </div>
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Dodatkowe informacje o dostawie
      </h3>

      <button
        type="button"
        class="text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
        @click="form.deliveryAdditionalInfoVisible = true"
      >
        DODAJ INFORMACJE
      </button>

      <el-input
        v-if="form.deliveryAdditionalInfoVisible"
        v-model="form.deliveryAdditionalInfo"
        type="textarea"
        :rows="4"
        maxlength="1000"
        show-word-limit
        class="mt-4 allegro-textarea"
        placeholder="Wpisz dodatkowe informacje o dostawie"
      />
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Formy płatności
      </h3>

      <div class="text-[22px] leading-none">
        <span class="text-[#ff5a00] font-bold">allegro</span>
        <span class="text-[#111827] ml-1">Finanse</span>
      </div>

      <p class="text-[11px] text-[#64748b] mt-1">
        Płatności elektroniczne.
      </p>
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-2">
        Wysyłka z
      </h3>

      <p class="text-xs text-[#111827]">
        {{ form.shippingFrom }}
      </p>

      <p class="mt-3 text-[11px] text-[#64748b] leading-5">
        Na podstawie kraju wysyłki i wybranej krajowej stawki VAT - pokażemy na Allegro Business
        cenę netto, jako informację dla kupujących.
      </p>

      <button
        type="button"
        class="mt-4 text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
      >
        ZMIEŃ
      </button>
    </div>
  </div>
</div>
<!-- CENA -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-6">
    Cena
  </h2>

  <div class="border-b border-[#9ca3af] pb-3 mb-6 grid grid-cols-[160px_180px_110px_1fr] gap-6 text-xs font-bold text-[#111827]">
    <div>Rynek</div>
    <div>
      Cena
      <div class="font-normal">Aktualny kurs</div>
    </div>
    <div>Automatyczne ceny</div>
    <div>Dodatkowe informacje</div>
  </div>

  <div class="grid grid-cols-[160px_180px_110px_1fr] gap-6 pb-8 border-b border-[#e5e7eb]">
    <div>
      <div class="flex items-center gap-2 text-xs font-bold text-[#111827] mb-3">
        🇵🇱 Polska
      </div>

      <ul class="list-disc pl-6 text-[11px] text-[#64748b] leading-5">
        <li>allegro.pl</li>
        <li>business.allegro.pl</li>
      </ul>
    </div>

    <div>
      <el-input
        v-model="form.price"
        placeholder="Cena"
        class="allegro-input"
      >
        <template #suffix>
          zł
        </template>
      </el-input>

      <div class="mt-3">
        <el-checkbox v-model="form.isAuction">
          <span class="text-xs text-[#111827]">licytacja</span>
        </el-checkbox>

        <p class="ml-6 text-[11px] text-[#64748b] leading-4">
          Sprzedaj przedmiot temu, kto zaoferuje więcej.
        </p>
      </div>
    </div>

    <div>
      <button
        type="button"
        class="text-xs text-[#00796b] underline"
      >
        podepnij regułę
      </button>
    </div>

    <div />
  </div>

  <div class="mt-6">
    <h3 class="text-sm font-bold text-[#111827] mb-3">
      Faktura VAT
    </h3>

    <div class="border border-[#e5e7eb] border-l-2 border-l-[#3b82f6] rounded-md p-5 mb-5">
      <div class="flex gap-4">
        <span class="text-[#2563eb] text-lg">ⓘ</span>

        <div>
          <p class="text-xs font-bold text-[#111827] mb-2">
            Aby sprzedawać na Allegro Business, uzupełnij stawki VAT.
          </p>

          <p class="text-xs text-[#111827] leading-5">
            Dzięki temu firmy będą mogły kupować Twoje produkty bezpośrednio w profilu firmowym business.allegro.pl.
            Nawet jeśli tego nie zrobisz, Twoje oferty nadal będą widoczne dla wszystkich kupujących na Allegro.
          </p>
        </div>
      </div>
    </div>

    <div class="max-w-[560px] space-y-5">
      <el-select
        v-model="form.invoiceOption"
        class="!w-[300px] allegro-select"
        placeholder="Opcje faktury"
      >
        <el-option label="faktura VAT" value="VAT" />
        <el-option label="faktura bez VAT" value="NO_VAT" />
        <el-option label="nie wystawiam faktury" value="NONE" />
      </el-select>

      <div class="grid grid-cols-2 gap-4">
        <el-select
          v-model="form.invoiceSubject"
          class="!w-full allegro-select"
          placeholder="Przedmiot oferty (opcjonalnie)"
          clearable
        >
          <el-option label="towar" value="GOODS" />
          <el-option label="usługa" value="SERVICE" />
        </el-select>

        <el-select
          v-model="form.vatExemptionReason"
          class="!w-full allegro-select"
          placeholder="Podstawa wyłączenia z VAT (opcjonalnie)"
          clearable
          :disabled="form.invoiceOption === 'VAT'"
        >
          <el-option label="zwolnienie podmiotowe" value="SUBJECTIVE" />
          <el-option label="zwolnienie przedmiotowe" value="OBJECTIVE" />
        </el-select>
      </div>

      <p class="text-xs text-[#111827]">
        Zadeklaruj stawkę VAT dla wybranych krajów.
      </p>

      <div v-if="showOfferForm" class="space-y-4">
          <el-select v-model="form.vatRatePoland" class="!w-[300px] allegro-select" placeholder="Stawka VAT Polska (opcjonalnie)" clearable>
          <el-option label="23%" value="23" />
          <el-option label="8%" value="8" />
          <el-option label="5%" value="5" />
          <el-option label="0%" value="0" />
        </el-select>

        <el-select v-model="form.vatRateSlovakia" class="!w-[300px] allegro-select" placeholder="Stawka VAT Słowacja (opcjonalnie)" clearable>
          <el-option label="23%" value="23" />
          <el-option label="20%" value="20" />
          <el-option label="10%" value="10" />
        </el-select>

        <el-select v-model="form.vatRateCzechia" class="!w-[300px] allegro-select" placeholder="Stawka VAT Czechy (opcjonalnie)" clearable>
          <el-option label="21%" value="21" />
          <el-option label="15%" value="15" />
          <el-option label="12%" value="12" />
        </el-select>

        <el-select v-model="form.vatRateHungary" class="!w-[300px] allegro-select" placeholder="Stawka VAT Węgry (opcjonalnie)" clearable>
          <el-option label="27%" value="27" />
          <el-option label="18%" value="18" />
          <el-option label="5%" value="5" />
        </el-select>
      </div>

      <p class="text-[11px] text-[#64748b] leading-4">
        W przypadku transakcji objętych regulacjami pakietu eCommerce VAT brak deklaracji traktowany będzie jako:
        Przedmiot oferty - towar, Stawka VAT (X) - podstawowa stawka VAT w kraju X.
      </p>
    </div>
  </div>

  <div class="mt-7 pt-5 border-t border-[#e5e7eb] max-w-[560px]">
    <h3 class="text-sm font-bold text-[#111827] mb-4">
      Rabat dla klientów biznesowych (opcjonalnie)
    </h3>

    <el-select
      v-model="form.businessDiscountListId"
      class="!w-full allegro-select"
      placeholder="Cennik hurtowy"
      clearable
    >
      <el-option label="Cennik hurtowy podstawowy" value="default" />
    </el-select>

    <p class="mt-2 text-[11px] text-[#64748b] leading-5">
      Jeśli nie masz odpowiedniego cennika —
      <button type="button" class="text-[#00796b] underline">
        dodaj cennik hurtowy
      </button>.
      Rabaty hurtowe są widoczne tylko dla kupujących na Allegro Business.
    </p>
  </div>
</div>
<!-- STAN MAGAZYNOWY -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-6">
    Stan magazynowy
  </h2>

  <div class="flex items-center gap-4 mb-8 max-w-[560px]">
    <el-input
      v-model="form.stockQuantity"
      placeholder="Liczba sztuk"
      class="allegro-input !w-[360px]"
    />

    <el-select
      v-model="form.stockUnit"
      class="allegro-select !w-[120px]"
    >
      <el-option label="sztuk" value="UNIT" />
      <el-option label="par" value="PAIR" />
      <el-option label="kompletów" value="SET" />
    </el-select>
  </div>

  <div class="mb-8">
    <h3 class="text-sm font-bold text-[#111827] mb-4">
      Wznawianie oferty
    </h3>

    <el-checkbox v-model="form.renewWithFullStock">
      <span class="text-xs text-[#111827]">
        po zakończeniu wystaw ponownie ofertę z <strong>pełną liczbą sztuk</strong>
      </span>
    </el-checkbox>

    <p class="ml-6 text-[11px] text-[#64748b] leading-5">
      Ofertę wznowimy ze stałą liczbą sztuk niezależnie od tego, ile przedmiotów sprzedasz.
    </p>
  </div>

  <div>
    <h3 class="text-sm font-bold text-[#111827] mb-4">
      Czas trwania
    </h3>

    <el-radio-group
      v-model="form.offerDuration"
      class="flex flex-col gap-4"
    >
      <el-radio value="UNTIL_SOLD">
        <span class="text-xs text-[#111827]">
          do wyczerpania przedmiotów
        </span>

        <p class="ml-6 text-[11px] text-[#64748b] leading-5">
          Oferta będzie dostępna, dopóki nie sprzedasz wszystkich przedmiotów.
        </p>
      </el-radio>

      <el-radio value="LIMITED_TIME">
        <span class="text-xs text-[#111827]">
          na określony czas
        </span>
      </el-radio>
    </el-radio-group>
  </div>
</div>

<!-- WARUNKI SPRZEDAŻY -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-6">
    Warunki sprzedaży
  </h2>

  <div class="space-y-7">
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Warunki zwrotów
      </h3>

      <el-select
        v-model="form.returnPolicyId"
        class="allegro-select !w-[360px]"
        placeholder="Warunki zwrotów"
        clearable
      >
      <el-option
        v-for="item in returnPolicies"
        :key="item.id"
        :label="item.name || item.id"
        :value="item.id"
      />
      </el-select>

      <p class="mt-2 text-[11px] text-[#111827]">
        Brak odpowiednich warunków?
        <button type="button" class="text-[#00796b] underline">
          Dodaj warunki zwrotu
        </button>
      </p>
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Reklamacje
      </h3>

      <div class="border border-[#d1d5db] p-4 grid grid-cols-2 gap-8 max-w-[1100px]">
        <div>
          <p class="text-[11px] uppercase text-[#475569]">
            Czas na reklamację
          </p>

          <p class="text-xs font-semibold text-[#111827]">
            2 lata
          </p>
        </div>

        <div>
          <p class="text-[11px] uppercase text-[#475569]">
            Adres do reklamacji
          </p>

          <p class="text-xs text-[#111827] leading-5">
            DataSharp Dawid Jabłoński<br>
            Polna 6<br>
            PR 66-340 Przytoczna
          </p>
        </div>
      </div>

      <p class="mt-2 text-[11px] text-[#111827]">
        Brak odpowiednich warunków?
        <button type="button" class="text-[#00796b] underline">
          Dodaj warunki reklamacji
        </button>
      </p>
    </div>
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Reklamacje / rękojmia
      </h3>

      <el-select
        v-model="form.impliedWarrantyId"
        class="allegro-select !w-[360px]"
        placeholder="Warunki reklamacji / rękojmi"
        clearable
        filterable
        :loading="loadingInitialData"
      >
        <el-option
          v-for="item in impliedWarranties"
          :key="item.id"
          :label="item.name || item.id"
          :value="item.id"
        />
      </el-select>

      <p class="mt-2 text-[11px] text-[#111827]">
        To pole jest wymagane do wystawienia oferty Allegro.
      </p>
    </div>
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Gwarancje (opcjonalnie)
      </h3>

      <el-select
        v-model="form.warrantyId"
        class="allegro-select !w-[360px]"
        placeholder="Gwarancje (opcjonalnie)"
        clearable
      >
        <el-option
          v-for="item in warranties"
          :key="item.id"
          :label="item.name || item.id"
          :value="item.id"
        />
      </el-select>

      <p class="mt-2 text-[11px] text-[#111827]">
        Brak odpowiednich warunków?
        <button type="button" class="text-[#00796b] underline">
          Dodaj informację o gwarancji
        </button>
      </p>
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Usługi dodatkowe (opcjonalnie)
      </h3>

      <button
        type="button"
        class="text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline"
        @click="form.additionalServicesVisible = true"
      >
        DODAJ USŁUGI DODATKOWE
      </button>

      <el-select
        v-if="form.additionalServicesVisible"
        v-model="form.additionalServiceId"
        class="allegro-select !w-[360px] mt-4"
        placeholder="Usługi dodatkowe"
        clearable
      >
        <el-option
          v-for="item in additionalServicesGroups"
          :key="item.id"
          :label="item.name || item.id"
          :value="item.id"
        />
      </el-select>
    </div>
  </div>
</div>
<!-- OPCJE WYSTAWIENIA -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-7">
    Opcje wystawienia
  </h2>

  <div class="space-y-8">
    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-4">
        Oferta pojawi się na Allegro
      </h3>

      <el-radio-group
        v-model="form.publishOption"
        class="flex flex-col gap-4"
      >
        <el-radio value="NOW">
          <span class="text-xs text-[#111827]">
            natychmiast
          </span>
        </el-radio>

        <el-radio value="SCHEDULED">
          <div class="flex items-center gap-3">
            <span class="text-xs text-[#111827]">
              Wybierz datę
            </span>

            <el-date-picker
              v-model="form.publishDate"
              type="date"
              format="DD MMMM YYYY"
              value-format="YYYY-MM-DD"
              class="!w-[180px]"
              :disabled="form.publishOption !== 'SCHEDULED'"
            />

            <el-time-picker
              v-model="form.publishTime"
              format="HH:mm"
              value-format="HH:mm"
              class="!w-[100px]"
              :disabled="form.publishOption !== 'SCHEDULED'"
            />
          </div>
        </el-radio>
      </el-radio-group>
    </div>

    <div>
      <h3 class="text-sm font-bold text-[#111827] mb-3">
        Dodanie produktu
      </h3>

      <p class="text-xs text-[#111827]">
        przy wystawianiu oferty stwórz jednocześnie produkt
      </p>
    </div>
  </div>
</div>

<!-- PODSUMOWANIE -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <h2 class="text-[22px] font-bold text-[#111827] mb-6">
    Podsumowanie
  </h2>

  <div class="max-w-[620px]">
    <h3 class="text-sm font-bold text-[#111827] mb-5">
      Prowizje od sprzedaży
    </h3>

    <div class="border-b border-[#111827] pb-2 mb-2">
      <p class="text-xs font-bold text-[#111827]">
        opłata za sprzedaż
      </p>
    </div>

    <div class="grid grid-cols-[1fr_auto] gap-4 text-xs text-[#111827] border-b border-[#e5e7eb] pb-3">
      <p>
        Prowizja od sprzedaży 1 sztuki (zależna od ceny dostawy)
      </p>

      <p class="font-semibold">
        {{ feePreview ? 'Pobrano z Allegro' : 'Kliknij „Sprawdź kalkulator opłat”' }}
      </p>
    </div>

    <button
      type="button"
      class="mt-3 text-xs text-[#00796b] underline"
      @click="previewFees"
    >
      Sprawdź kalkulator opłat
    </button>
  </div>

  <p class="mt-5 text-[11px] text-[#64748b] leading-5">
    Podana wycena jest wyceną szacunkową - opiera się na aktualnej konfiguracji oferty
    i nie uwzględnia wcześniejszych opłat zarejestrowanych dla oferty.
    Pełna kwota opłat dla oferty dostępna będzie po jej zatwierdzeniu w zakładce
    <button type="button" class="text-[#00796b] underline">
      Rozliczenia z Allegro
    </button>.
    Zasady wyznaczania opłat opisane są w
    <button type="button" class="text-[#00796b] underline">
      Regulaminie Allegro
    </button>.
  </p>
</div>

<!-- PASEK AKCJI -->
<div class="bg-white border border-[#d6dfe9] rounded-xl p-6">
  <div class="flex items-start justify-end mb-5">
    <p
      v-if="form.saveError"
      class="text-xs text-[#111827]"
    >
      Nie udało się zapisać zmian
    </p>
  </div>

  <div class="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-6 items-start">
    <div class="flex justify-center md:justify-end">
      <button
        type="button"
        class="h-[42px] px-8 text-xs font-bold tracking-[0.22em] text-[#00796b] hover:underline disabled:opacity-50"
        :disabled="loadingPreview"
        @click="previewOffer"
      >
        {{ loadingPreview ? 'POBIERAM...' : 'ZOBACZ PODGLĄD OFERTY' }}
      </button>
    </div>

    <div>
    <button
      type="button"
      class="w-full h-[42px] bg-[#4f6bed] hover:bg-[#3f5bdc] text-white text-xs font-bold tracking-[0.18em] rounded disabled:opacity-50"
      :disabled="loadingPublish"
      @click="publishOffer"
    >
      {{ loadingPublish ? 'WYSTAWIAM...' : 'WYSTAW PRZEDMIOT' }}
    </button>

      <p class="mt-2 text-[11px] text-[#64748b] leading-4">
        Gdy klikasz [wystaw przedmiot], oświadczasz, że treść oferty została przez Ciebie sprawdzona,
        jest prawidłowa i zgodna z przepisami prawa i
        <button type="button" class="text-[#00796b] underline">
          Regulaminem Allegro
        </button>.
        Znasz też treść danych o produkcie i o jego producencie.
      </p>
    </div>
  </div>
</div>
      <!-- MODAL KATEGORII -->
      <el-dialog
        v-model="categoryModalVisible"
        title="Wybierz kategorię Allegro"
        width="900px"
        destroy-on-close
      >
        <div v-loading="categoryLoading" class="space-y-4">
          <div
            v-if="categoryPath.length"
            class="bg-[#f8fafc] border border-[#e2e8f0] rounded-lg p-3"
          >
            <div class="text-xs text-[#64748b] mb-1">
              Wybrana ścieżka:
            </div>

            <div class="flex flex-wrap items-center gap-2 text-sm">
              <template
                v-for="(item, index) in categoryPath"
                :key="item.id"
              >
                <button
                  class="font-semibold text-[#00796b] hover:underline"
                  type="button"
                  @click="goToCategoryLevel(index)"
                >
                  {{ item.name }}
                </button>

                <span
                  v-if="index < categoryPath.length - 1"
                  class="text-[#94a3b8]"
                >
                  /
                </span>
              </template>
            </div>
          </div>

          <div class="border border-[#d6dfe9] rounded-xl overflow-hidden">
            <div class="bg-[#f1f5f9] px-4 py-3 text-xs font-semibold text-[#475569]">
              {{ categoryPath.length ? 'Kategorie podrzędne' : 'Kategorie główne' }}
            </div>

            <div class="max-h-[430px] overflow-auto">
              <button
                v-for="category in currentCategories"
                :key="category.id"
                class="w-full flex justify-between items-center px-4 py-3 border-b border-[#e5e7eb] text-left hover:bg-[#f8fafc]"
                type="button"
                @click="selectCategory(category)"
              >
                <div>
                  <div class="text-sm font-semibold text-[#111827]">
                    {{ category.name }}
                  </div>

                  <div class="text-xs text-[#64748b] mt-1">
                    Nr kategorii {{ category.id }}
                  </div>
                </div>

                <div class="text-xs text-[#00796b] font-semibold">
                  Wybierz
                </div>
              </button>

              <el-empty
                v-if="!currentCategories.length"
                description="Brak kolejnych podkategorii"
              />
            </div>
          </div>

          <div
            v-if="categoryPath.length"
            class="flex justify-between items-center"
          >
            <el-button @click="goBackCategory">
              Wróć poziom wyżej
            </el-button>

            <el-button color="#ea580c" @click="confirmCategory">
              Zatwierdź tę kategorię
            </el-button>
          </div>
        </div>
      </el-dialog>
    </div>

    <ProductDescriptionRewriteModal
      v-if="descriptionRewriteModalVisible"
      :loading="descriptionRewriteLoading"
      :sections-count="form.descriptionRows.length"
      :default-product-page-url="defaultProductPageUrl"
      @close="descriptionRewriteModalVisible = false"
      @generate="handleDescriptionRewriteGenerate"
    />
</template>

<script lang="ts" setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { Api } from '/@/services/api'
import AllegroPhotosAndDescription from '/@/components/Form/Allegro/AllegroPhotosAndDescription.vue'
import ProductDescriptionRewriteModal from '/@/components/Form/Modal/ProductDescriptionRewriteModal.vue'
import {
  ALLEGRO_DESCRIPTION_TEMPLATE_ID,
  getDescriptionTemplate,
} from '/@/utils/descriptionTemplates.ts'
import {
  applyAllegroParameterDefaults,
  applyParameterValuesFromApi,
  buildAllegroRowsFromVisionSections,
  buildFeePreviewBody,
  createDefaultDescriptionRows,
  extractAllegroUrlFromUpload,
  mapAllegroImagesFromSyncDto,
  mapProductMediasToAllegroPhotos,
  prepareDescriptionRowsForAllegro,
} from '/@/components/Form/Allegro/allegroOfferForm.ts'

const props = defineProps<{
  productId: string
}>()

const categoryModalVisible = ref(false)
const categoryLoading = ref(false)
const loadingPublish = ref(false)
const loadingPreview = ref(false)
const loadingInitialData = ref(false)

const currentCategories = ref<any[]>([])
const categoryPath = ref<any[]>([])
const selectedCategory = ref<any | null>(null)

const parameters = ref<any[]>([])
const showAllParameters = ref(false)

const responsibleProducers = ref<any[]>([])
const responsiblePersons = ref<any[]>([])
const additionalServicesGroups = ref<any[]>([])
const returnPolicies = ref<any[]>([])
const impliedWarranties = ref<any[]>([])
const warranties = ref<any[]>([])
const deliveryPriceLists = ref<any[]>([])
const taxSettings = ref<any[]>([])
const feePreview = ref<any | null>(null)

const catalogModalVisible = ref(false)
const catalogSearchPhrase = ref('')
const catalogProducts = ref<any[]>([])
const catalogLoading = ref(false)
const showOfferForm = ref(false)
const catalogSearched = ref(false)
const productData = ref<any>(null)
const descriptionRewriteModalVisible = ref(false)
const descriptionRewriteLoading = ref(false)
const descriptionAutoGenerated = ref(false)

const storefrontBaseUrl = String(import.meta.env.VITE_STOREFRONT_URL || '').replace(/\/$/, '')

const defaultProductPageUrl = computed(() => {
  const slug = String(productData.value?.slug || productData.value?.Slug || '').trim()
  if (!storefrontBaseUrl || !slug) return ''
  return `${storefrontBaseUrl}/${slug}`
})

const form = reactive({
  title: '',
  signature: '',
  categoryId: null as string | null,

  condition: 'NEW',
  parameterValues: {} as Record<string, any>,

  producerData: null as string | null,
  responsibleProducerId: null as string | null,
  responsiblePersonId: null as string | null,

  safetyInformation: 'customText' as string | null,
  responsiblePersonVisible: false,
  responsiblePersonName: '',
  responsiblePersonEmail: '',
  safetyText: 'Produkt wprowadzony do obrotu przed 13.12.2024',

  purchaseNotesOption: 'OPTIONAL',

  deliveryPriceListId: null as string | null,
  shippingRateId: null as string | null,
  shippingTime: 'PT72H',
  isPresale: false,
  deliveryAdditionalInfoVisible: false,
  deliveryAdditionalInfo: '',
  shippingFrom: 'Polska',

  price: null as number | null,
  isAuction: false,

  invoiceOption: 'VAT',
  invoiceSubject: 'GOODS',
  vatExemptionReason: null as string | null,
  vatRatePoland: '23',
  vatRateSlovakia: null as string | null,
  vatRateCzechia: null as string | null,
  vatRateHungary: null as string | null,

  businessDiscountListId: null as string | null,

  stockQuantity: 1000 as number | null,
  stockUnit: 'UNIT',
  renewWithFullStock: true,
  offerDuration: 'UNTIL_SOLD',

  returnPolicyId: null as string | null,
  impliedWarrantyId: null as string | null,
  warrantyId: null as string | null,

  additionalServicesVisible: false,
  additionalServiceId: null as string | null,

  publishOption: 'NOW',
  publishDate: '',
  publishTime: '',

  photos: [] as any[],
  descriptionRows: createDefaultDescriptionRows(),

  saveError: false,

  allegroCatalogProductId: null as string | null,
  allegroCatalogProductName: null as string | null,
  checkingCatalogProduct: false,
})

const openCatalogModal = () => {
  catalogModalVisible.value = true
  catalogSearched.value = false
  catalogProducts.value = []
}

const getProductCategoryIds = () => {
  const ids = productData.value?.categoryIds ?? productData.value?.CategoryIds ?? []
  return Array.isArray(ids) ? ids.map((id: unknown) => String(id)) : []
}

const applyDefaultAllegroCategoryFromProductCategories = async () => {
  const productCategoryIds = getProductCategoryIds()

  if (!productCategoryIds.length) {
    return false
  }

  try {
    const result = await Api.categories.listByStoreId()
    const categories = normalizeList(result)
    const mappedCategory = categories.find((category: any) => {
      const categoryId = String(category?.id ?? category?.Id ?? '')
      const allegroCategoryId = String(
        category?.allegroCategoryId ??
        category?.AllegroCategoryId ??
        ''
      ).trim()

      return productCategoryIds.includes(categoryId) && allegroCategoryId
    })

    if (!mappedCategory) {
      return false
    }

    const allegroCategoryId = String(
      mappedCategory.allegroCategoryId ??
      mappedCategory.AllegroCategoryId
    ).trim()
    const allegroCategoryName = String(
      mappedCategory.allegroCategoryName ??
      mappedCategory.AllegroCategoryName ??
      allegroCategoryId
    ).trim()

    selectedCategory.value = {
      id: allegroCategoryId,
      name: allegroCategoryName
    }
    form.categoryId = allegroCategoryId
    categoryPath.value = [
      {
        id: allegroCategoryId,
        name: allegroCategoryName
      }
    ]

    await loadCategoryParameters(allegroCategoryId)
    await loadTaxSettings(allegroCategoryId)

    return true
  } catch (error) {
    console.warn('Nie udało się ustawić domyślnej kategorii Allegro z kategorii produktu.', error)
    return false
  }
}

const searchCatalogByGtin = async () => {
  if (!catalogSearchPhrase.value) {
    ElMessage.warning('Wpisz GTIN / EAN.')
    return
  }

  catalogLoading.value = true
  catalogSearched.value = true
  catalogProducts.value = []

  try {
    const result = await Api.allegro.searchCatalogProducts(
      catalogSearchPhrase.value,
      form.categoryId,
      10,
      0
    )

    catalogProducts.value = normalizeList(result)

    if (!catalogProducts.value.length) {
      const applied = await applyDefaultAllegroCategoryFromProductCategories()
      if (applied) {
        ElMessage.info('Nie znaleziono produktu po GTIN. Ustawiono domyślną kategorię Allegro z kategorii sklepowej.')
      }
    }
  } catch (e) {
    console.error(e)
    ElMessage.error('Nie udało się pobrać produktów z Katalogu Allegro.')
  } finally {
    catalogLoading.value = false
  }
}

const selectCatalogProduct = async (item: any) => {
  form.allegroCatalogProductId = item.id
  form.allegroCatalogProductName = item.name

  if (item.name) {
    form.title = item.name
  }

  if (item.categoryId || item.category?.id) {
    const categoryId = item.categoryId || item.category?.id

    selectedCategory.value = {
      id: categoryId,
      name: item.categoryName || item.category?.name || categoryId
    }

    form.categoryId = categoryId

    categoryPath.value = [
      {
        id: categoryId,
        name: item.categoryName || item.category?.name || categoryId
      }
    ]

    await loadCategoryParameters(categoryId)
    await loadTaxSettings(categoryId)
  }

  if (item.imageUrl) {
    form.photos = [
      {
        id: crypto.randomUUID(),
        url: item.imageUrl
      }
    ]
  }

  fillCatalogProductParameters(item)

  catalogModalVisible.value = false
  showOfferForm.value = true

  await loadProductPhotos()
  await autoGenerateAllegroDescription(false)

  ElMessage.success('Wybrano produkt z Katalogu Allegro.')
}

const createNewCatalogProduct = async () => {
  form.allegroCatalogProductId = null
  form.allegroCatalogProductName = null

  if (!form.categoryId) {
    await applyDefaultAllegroCategoryFromProductCategories()
  }

  catalogModalVisible.value = false
  showOfferForm.value = true

  await loadProductPhotos()
  await autoGenerateAllegroDescription(false)

  ElMessage.info('Uzupełnij formularz, aby dodać nowy produkt.')
}

const fillCatalogProductParameters = (item: any) => {
  if (!Array.isArray(item.parameters)) return

  item.parameters.forEach((param: any) => {
    const parameterId = String(param.id || '')
    if (!parameterId) return

    const value =
      param.valuesIds?.[0] ||
      param.values?.[0] ||
      param.rangeValueFrom ||
      param.rangeValueTo ||
      null

    if (value !== null && value !== undefined && value !== '') {
      form.parameterValues[parameterId] = value
    }
  })

  const gtinParam = item.parameters.find((x: any) =>
    String(x.name || '').toLowerCase().includes('gtin') ||
    String(x.name || '').toLowerCase().includes('ean')
  )

  if (gtinParam?.id && gtinParam.values?.[0]) {
    form.parameterValues[String(gtinParam.id)] = gtinParam.values[0]
  }

  const producerCodeParam = item.parameters.find((x: any) =>
    String(x.name || '').toLowerCase().includes('kod producenta') ||
    String(x.name || '').toLowerCase().includes('mpn') ||
    String(x.name || '').toLowerCase().includes('manufacturer')
  )

  if (producerCodeParam?.id && producerCodeParam.values?.[0]) {
    form.parameterValues[String(producerCodeParam.id)] = producerCodeParam.values[0]
  }
}

const selectedCategoryPathText = computed(() => {
  return categoryPath.value.map(x => x.name).join(' - ')
})

const normalizeList = (result: any) => {
  const data = result?.data || result

  if (Array.isArray(data)) return data
  if (Array.isArray(data?.items)) return data.items
  if (Array.isArray(data?.responsibleProducers)) return data.responsibleProducers
  if (Array.isArray(data?.responsiblePersons)) return data.responsiblePersons
  if (Array.isArray(data?.additionalServicesGroups)) return data.additionalServicesGroups
  if (Array.isArray(data?.taxSettings)) return data.taxSettings

  return []
}

const onSafetyInformationChange = (value: string) => {
  if (value !== 'customText') {
    form.safetyText = ''
  }
}

const visibleParameters = computed(() => {
  if (showAllParameters.value) return parameters.value

  const required = parameters.value.filter((param: any) => param.required)
  const optional = parameters.value.filter((param: any) => !param.required)

  return [...required, ...optional].slice(0, 6)
})

const openCategoryModal = async () => {
  categoryModalVisible.value = true

  if (!categoryPath.value.length) {
    await loadCategories(null)
  }
}

const loadCategories = async (parentId?: string | null) => {
  categoryLoading.value = true

  try {
    const result = await Api.allegro.getCategories(parentId || null)
    currentCategories.value = normalizeList(result)
  } finally {
    categoryLoading.value = false
  }
}

const selectCategory = async (category: any) => {
  categoryPath.value.push(category)

  await loadCategories(category.id)

  if (!currentCategories.value.length) {
    await setSelectedCategory(category)
    categoryModalVisible.value = false
  }
}

const confirmCategory = async () => {
  const lastCategory = categoryPath.value[categoryPath.value.length - 1]
  if (!lastCategory) return

  await setSelectedCategory(lastCategory)
  categoryModalVisible.value = false
}

const setSelectedCategory = async (category: any) => {
  selectedCategory.value = category
  form.categoryId = category.id
  showAllParameters.value = false

  await loadCategoryParameters(category.id)
  await loadTaxSettings(category.id)
}

const loadTaxSettings = async (categoryId: string) => {
  try {
    const result = await Api.allegro.getTaxSettings(categoryId)
    taxSettings.value = normalizeList(result)
  } catch (e) {
    console.error(e)
    taxSettings.value = []
  }
}

const goBackCategory = async () => {
  categoryPath.value.pop()
  const parent = categoryPath.value[categoryPath.value.length - 1]
  await loadCategories(parent?.id || null)
}

const goToCategoryLevel = async (index: number) => {
  categoryPath.value = categoryPath.value.slice(0, index + 1)
  const category = categoryPath.value[index]
  await loadCategories(category.id)
}

const loadCategoryParameters = async (categoryId: string) => {
  const result = await Api.allegro.getCategoryParameters(categoryId)
  parameters.value = normalizeList(result)

  parameters.value.forEach((param: any) => {
    if (form.parameterValues[param.id] === undefined) {
      form.parameterValues[param.id] = null
    }
  })

  applyAllegroParameterDefaults(parameters.value, form.parameterValues)
}

const loadSavedMapping = async () => {
  try {
    const mappingResult = await Api.allegro.getProductMapping(props.productId)
    const mapping = mappingResult?.data || mappingResult
    if (!mapping?.categoryId) return

    selectedCategory.value = {
      id: mapping.categoryId,
      name: mapping.categoryName || mapping.categoryId,
    }
    form.categoryId = mapping.categoryId
    categoryPath.value = [
      {
        id: mapping.categoryId,
        name: mapping.categoryName || mapping.categoryId,
      },
    ]

    await loadCategoryParameters(mapping.categoryId)
    applyParameterValuesFromApi(form.parameterValues, mapping.parameterValues || [])

    form.deliveryPriceListId = mapping.deliveryPriceListId || form.deliveryPriceListId
    form.returnPolicyId = mapping.returnPolicyId || form.returnPolicyId
    form.impliedWarrantyId = mapping.impliedWarrantyId || form.impliedWarrantyId
    form.warrantyId = mapping.warrantyId || form.warrantyId
    form.shippingRateId = mapping.shippingRateId || form.shippingRateId
  } catch (error) {
    console.warn('Brak zapisanego mapowania Allegro.', error)
  }
}

const loadProductPhotos = async () => {
  const existingPhotos = [...form.photos]

  try {
    try {
      await Api.allegro.syncProductImages(props.productId)
    } catch (error) {
      console.warn('syncProductImages:', error)
    }

    const imagesResult = await Api.allegro.getProductImages(props.productId)
    const syncedPhotos = mapAllegroImagesFromSyncDto(normalizeList(imagesResult))

    if (syncedPhotos.length) {
      form.photos = syncedPhotos
      return
    }
  } catch (error) {
    console.warn('getProductImages:', error)
  }

  if (existingPhotos.length) {
    form.photos = existingPhotos
    return
  }

  const medias = productData.value?.medias || productData.value?.Medias || []
  const fallbackPhotos = mapProductMediasToAllegroPhotos(medias)

  if (fallbackPhotos.length) {
    form.photos = fallbackPhotos
  }
}

const loadProductContext = async () => {
  if (!props.productId) return

  try {
    const productResult = await Api.products.get(props.productId)
    productData.value = productResult?.data || productResult

    if (!form.title && productData.value?.name) {
      form.title = productData.value.name
    }

    if ((form.price === null || form.price === undefined) && productData.value?.price) {
      form.price = Number(productData.value.price)
    }

    if (!form.signature && productData.value?.identificationCode) {
      form.signature = productData.value.identificationCode
    }

    await loadSavedMapping()
    await loadProductPhotos()
  } catch (error) {
    console.error(error)
  }
}

const generateAllegroDescription = async (productPageUrl: string, showMessages = true) => {
  const template = getDescriptionTemplate(ALLEGRO_DESCRIPTION_TEMPLATE_ID)

  try {
    descriptionRewriteLoading.value = true

    const body = {
      productDescriptionVisionBriefDTO: {
        productName: form.title || productData.value?.name || '',
        exampleDescription:
          productData.value?.shortDescription ||
          productData.value?.description ||
          '',
        specification: productData.value?.specification || '',
        competitorUrl: productPageUrl || defaultProductPageUrl.value,
        sectionsCount: template.slots.length,
        templateSlots: template.slots.map(slot => ({
          layout: slot.layout,
          label: slot.label,
          purpose: slot.purpose,
          headingHint: slot.headingHint || null,
        })),
        imageUrls: form.photos
          .map(photo => photo.allegroUrl || photo.url)
          .filter(Boolean),
        imageBase64Items: [],
      },
    }

    const response = await Api.chatGpt.generateProductDescriptionVision({
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      throw new Error('Błąd odpowiedzi serwera')
    }

    const json = await response.json()
    const data = json?.data ?? json
    const sections = data?.sections ?? data?.Sections ?? []

    if (!sections.length) {
      if (showMessages) {
        ElMessage.error('AI nie zwróciło sekcji opisu.')
      }
      return false
    }

    const newRows = buildAllegroRowsFromVisionSections(
      sections,
      template.slots,
      form.photos,
    )

    if (!newRows.length) {
      if (showMessages) {
        ElMessage.error('Nie udało się zbudować sekcji opisu.')
      }
      return false
    }

    form.descriptionRows = newRows
    descriptionAutoGenerated.value = true

    if (showMessages) {
      ElMessage.success('Wygenerowano opis Allegro według szablonu.')
    }

    return true
  } catch (error) {
    console.error(error)
    if (showMessages) {
      ElMessage.error('Nie udało się wygenerować opisu Allegro.')
    }
    return false
  } finally {
    descriptionRewriteLoading.value = false
  }
}

const autoGenerateAllegroDescription = async (showMessages = false) => {
  if (descriptionAutoGenerated.value || form.descriptionRows.length) {
    return
  }

  const productPageUrl = defaultProductPageUrl.value
  if (!productPageUrl && !form.title?.trim()) {
    return
  }

  await generateAllegroDescription(productPageUrl, showMessages)
}

const openDescriptionRewriteModal = () => {
  if (!form.title?.trim() && !defaultProductPageUrl.value) {
    ElMessage.warning('Uzupełnij tytuł oferty lub poczekaj na dane produktu.')
    return
  }

  descriptionRewriteModalVisible.value = true
}

const handleDescriptionRewriteGenerate = async (config: { productPageUrl: string }) => {
  const productPageUrl = config.productPageUrl?.trim() || defaultProductPageUrl.value

  if (!productPageUrl) {
    ElMessage.warning('Podaj URL produktu na stronie sklepu.')
    return
  }

  const generated = await generateAllegroDescription(productPageUrl, true)
  if (generated) {
    descriptionRewriteModalVisible.value = false
  }
}

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const getParamValues = (param: any) => {
  return param.values || param.dictionaryValues || param.dictionary || param.options || []
}

const isNumberParameter = (param: any) => {
  const type = String(param.type || param.valueType || '').toLowerCase()

  return (
    type.includes('int') ||
    type.includes('float') ||
    type.includes('number') ||
    type.includes('decimal')
  )
}

const isBooleanParameter = (param: any) => {
  const type = String(param.type || param.valueType || '').toLowerCase()
  return type.includes('bool')
}

const loadInitialData = async () => {
  loadingInitialData.value = true

  try {
    const [
      producersResult,
      personsResult,
      servicesResult,
      returnPoliciesResult,
      impliedWarrantiesResult,
      warrantiesResult,
      deliveryPriceListsResult,
    ] = await Promise.allSettled([
      Api.allegro.getResponsibleProducers?.(),
      Api.allegro.getResponsiblePersons?.(),
      Api.allegro.getAdditionalServicesGroups?.(),
      Api.allegro.getReturnPolicies(),
      Api.allegro.getImpliedWarranties(),
      Api.allegro.getWarranties(),
      Api.allegro.getDeliveryPriceLists(),
    ])

    responsibleProducers.value =
      producersResult.status === 'fulfilled'
        ? normalizeList(producersResult.value)
        : []

    responsiblePersons.value =
      personsResult.status === 'fulfilled'
        ? normalizeList(personsResult.value)
        : []

    additionalServicesGroups.value =
      servicesResult.status === 'fulfilled'
        ? normalizeList(servicesResult.value)
        : []

    returnPolicies.value =
      returnPoliciesResult.status === 'fulfilled'
        ? normalizeList(returnPoliciesResult.value)
        : []

    impliedWarranties.value =
      impliedWarrantiesResult.status === 'fulfilled'
        ? normalizeList(impliedWarrantiesResult.value)
        : []

    warranties.value =
      warrantiesResult.status === 'fulfilled'
        ? normalizeList(warrantiesResult.value)
        : []

    deliveryPriceLists.value =
      deliveryPriceListsResult.status === 'fulfilled'
        ? normalizeList(deliveryPriceListsResult.value)
        : []

    // DOMYŚLNE WARTOŚCI

    const olmagProducer = responsibleProducers.value.find((x: any) =>
      String(x.name || '').toLowerCase().includes('olmag')
    )

    form.responsibleProducerId =
      olmagProducer?.id ||
      responsibleProducers.value[0]?.id ||
      null

    form.returnPolicyId =
      returnPolicies.value[0]?.id || null

    form.impliedWarrantyId =
      impliedWarranties.value[0]?.id || null

    form.warrantyId =
      warranties.value[0]?.id || null

    form.shippingTime = 'PT72H'

    form.stockQuantity = 1000
    form.stockUnit = 'UNIT'

    form.renewWithFullStock = true

    form.offerDuration = 'UNTIL_SOLD'

    form.publishOption = 'NOW'

    form.condition = 'NEW'
  } finally {
    loadingInitialData.value = false
  }
}

const buildParameterValues = () => {
  return Object.entries(form.parameterValues)
    .filter(([_, value]) => value !== null && value !== undefined && value !== '')
    .map(([parameterId, value]) => {
      const param = parameters.value.find((x: any) => x.id === parameterId)
      const dictionaryValues = getParamValues(param || {})

      const selectedDictionary = dictionaryValues.find((x: any) =>
        x.id === value || x.value === value || x.name === value
      )

      return {
        parameterId,
        valueId: selectedDictionary?.id ?? null,
        value: selectedDictionary?.id ? null : String(value),
        describesProduct: param?.describesProduct === true
      }
    })
}

const saveMapping = async () => {
  form.saveError = false

  if (!props.productId) {
    throw new Error('Brak productId.')
  }

  if (!form.categoryId) {
    throw new Error('Wybierz kategorię Allegro.')
  }

await Api.allegro.saveProductMapping(props.productId, {
  categoryId: form.categoryId,
  parameterValues: buildParameterValues(),

  deliveryPriceListId: form.deliveryPriceListId,
  returnPolicyId: form.returnPolicyId,
  impliedWarrantyId: form.impliedWarrantyId,
  warrantyId: form.warrantyId,

  shippingRateId: form.shippingRateId || form.deliveryPriceListId,

  priceMultiplier: 1,
  stockMode: form.stockUnit,
  active: true,
  allegroCatalogProductId: form.allegroCatalogProductId,

  // BRAKUJĄCE DANE:
  price: form.price,
  stockQuantity: form.stockQuantity,
  condition: form.condition,
  shippingTime: form.shippingTime,

  invoiceOption: form.invoiceOption,
  invoiceSubject: form.invoiceSubject,
  vatExemptionReason: form.vatExemptionReason,
  vatRatePoland: form.vatRatePoland,
  vatRateSlovakia: form.vatRateSlovakia,
  vatRateCzechia: form.vatRateCzechia,
  vatRateHungary: form.vatRateHungary,

  responsibleProducerId: form.responsibleProducerId,
  responsiblePersonId: form.responsiblePersonId,
  safetyInformation: form.safetyInformation,
  safetyText: form.safetyText,

  purchaseNotesOption: form.purchaseNotesOption,
  deliveryAdditionalInfo: form.deliveryAdditionalInfo,
  offerDuration: form.offerDuration,
  renewWithFullStock: form.renewWithFullStock,
  businessDiscountListId: form.businessDiscountListId,
  additionalServiceId: form.additionalServiceId
})
}

const previewFees = async () => {
  if (!form.categoryId) {
    ElMessage.error('Wybierz kategorię, aby sprawdzić prowizję.')
    return
  }

  if (!form.price || Number(form.price) <= 0) {
    ElMessage.error('Podaj cenę, aby sprawdzić prowizję.')
    return
  }

  try {
    feePreview.value = await Api.allegro.previewOfferFees(
      buildFeePreviewBody({
        title: form.title,
        categoryId: form.categoryId,
        price: form.price,
        stockQuantity: form.stockQuantity,
        stockUnit: form.stockUnit,
        deliveryPriceListId: form.deliveryPriceListId,
        isAuction: form.isAuction,
      })
    )
    ElMessage.success('Pobrano prowizje z Allegro.')
  } catch (e) {
    console.error(e)
    ElMessage.error('Nie udało się pobrać prowizji.')
  }
}

const previewOffer = async () => {
  loadingPreview.value = true

  try {
    await saveMapping()

    const result = await Api.allegro.getOfferPreview(props.productId)

    ElMessage.success('Podgląd oferty pobrany poprawnie.')
    console.log('Offer preview:', result)
  } catch (e: any) {
    form.saveError = true
    ElMessage.error(e?.message || 'Nie udało się pobrać podglądu oferty.')
    console.error(e)
  } finally {
    loadingPreview.value = false
  }
}

const publishOffer = async () => {
  loadingPublish.value = true
  form.saveError = false

  try {
    await saveMapping()

    try {
      await Api.allegro.syncProductImages(props.productId)
      const imagesResult = await Api.allegro.getProductImages(props.productId)
      const syncedPhotos = mapAllegroImagesFromSyncDto(normalizeList(imagesResult))

      if (syncedPhotos.length) {
        form.photos = syncedPhotos
      }
    } catch (error) {
      console.warn('syncProductImages before publish:', error)
    }

    const uploadedManualImages: string[] = []

    for (const photo of form.photos) {
      if (photo.allegroUrl) {
        uploadedManualImages.push(photo.allegroUrl)
        continue
      }

      if (photo.file) {
        const base64File = await fileToBase64(photo.file)
        const uploaded = await Api.allegro.uploadImage(base64File)

        const allegroUrl = extractAllegroUrlFromUpload(uploaded)

        if (allegroUrl) {
          photo.allegroUrl = allegroUrl
          uploadedManualImages.push(allegroUrl)
        }

        continue
      }

      if (
        photo.url &&
        photo.url.startsWith('https://') &&
        photo.url.includes('allegroimg.com')
      ) {
        uploadedManualImages.push(photo.url)
      }
    }

    const imageUrls = uploadedManualImages
      .filter(Boolean)
      .filter((x: string) => x.startsWith('https://'))
      .filter((x: string) => x.includes('allegroimg.com'))
      .filter((value, index, self) => self.indexOf(value) === index)

    if (!imageUrls.length) {
      ElMessage.error('Dodaj co najmniej jedno zdjęcie.')
      return
    }

    const startingAt =
      form.publishOption === 'SCHEDULED' && form.publishDate && form.publishTime
        ? `${form.publishDate}T${form.publishTime}:00`
        : null

    const descriptionRows = await prepareDescriptionRowsForAllegro(
      form.descriptionRows,
      form.photos,
      base64File => Api.allegro.uploadImage(base64File),
    )

    const result = await Api.allegro.publishProduct(props.productId, {
      publishImmediately: form.publishOption === 'NOW',
      startingAt,
      offerName: form.title,
      imageUrls,
      descriptionRows,

      price: form.price ? Number(form.price) : null,
      stockQuantity: form.stockQuantity ? Number(form.stockQuantity) : null,
      stockUnit: form.stockUnit,
      condition: form.condition,

      deliveryPriceListId: form.deliveryPriceListId,
      shippingTime: form.shippingTime,

      returnPolicyId: form.returnPolicyId,
      impliedWarrantyId: form.impliedWarrantyId,
      warrantyId: form.warrantyId,

      invoiceOption: form.invoiceOption,
      invoiceSubject: form.invoiceSubject,
      vatRatePoland: form.vatRatePoland,

      safetyText: form.safetyText,
      responsibleProducerId: form.responsibleProducerId,
      allegroCatalogProductId: form.allegroCatalogProductId,
      offerDuration: form.offerDuration,
      renewWithFullStock: form.renewWithFullStock,
    })

    if (result?.allegroOfferId && result?.operationId) {
      const operation = await Api.allegro.getOfferOperationStatus(
        result.allegroOfferId,
        result.operationId
      )

      console.log('Allegro publication operation:', operation)
    }

    ElMessage.success('Oferta została wysłana do Allegro.')
  } catch (e: any) {
    form.saveError = true
    ElMessage.error(e?.message || 'Nie udało się wystawić oferty.')
    console.error(e)
  } finally {
    loadingPublish.value = false
  }
}

onMounted(async () => {
  showOfferForm.value = false
  catalogModalVisible.value = true

  await Promise.all([
    loadCategories(null),
    loadInitialData(),
    loadProductContext(),
  ])
})
</script>

<style scoped>
:deep(.allegro-input .el-input__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  background: #ffffff;
  box-shadow: 0 0 0 1px #9ca3af inset;
  transition: all 0.2s ease;
}

:deep(.allegro-input .el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #6b7280 inset;
}

:deep(.allegro-input .el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 2px #22c55e inset;
}

:deep(.allegro-input .el-input__inner) {
  font-size: 14px;
  color: #111827;
}

:deep(.allegro-input .el-input__count) {
  color: #64748b;
  font-size: 11px;
  background: transparent;
}

:deep(.el-input__count-inner) {
  background: transparent;
}

:deep(.allegro-select .el-select__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #9ca3af inset;
}

:deep(.allegro-select .el-select__wrapper:hover) {
  box-shadow: 0 0 0 1px #6b7280 inset;
}

:deep(.allegro-select .el-select__wrapper.is-focused) {
  box-shadow: 0 0 0 2px #22c55e inset;
}

:deep(.allegro-input-number .el-input__wrapper) {
  min-height: 42px;
  border-radius: 4px;
  box-shadow: 0 0 0 1px #9ca3af inset;
}

:deep(.el-dialog) {
  border-radius: 14px;
}

:deep(.el-dialog__header) {
  padding: 22px 24px 12px;
}

:deep(.el-dialog__body) {
  padding: 16px 24px 24px;
}

:deep(.allegro-textarea .el-textarea__inner) {
  min-height: 150px;
  border-radius: 2px;
  box-shadow: 0 0 0 1px #9ca3af inset;
  font-size: 13px;
}

:deep(.allegro-textarea .el-textarea__inner:focus) {
  box-shadow: 0 0 0 2px #22c55e inset;
}

:deep(.allegro-textarea .el-input__count) {
  color: #64748b;
  font-size: 11px;
  background: transparent;
}
</style>
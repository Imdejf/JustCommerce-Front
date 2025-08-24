<script lang="ts" setup>
import { Api } from '/@/services/api'
import { useRouter } from 'vue-router'


const props = defineProps({
    offer: {
        type: Object,
        default: null
    },
});

const emit = defineEmits(['closeOffer'])
const router = useRouter()

const closeOfferHandle = () => {
    emit('closeOffer')
}

const generateOrDownloadOfferHandle = async (offerId: string) => {
    try {
        const response = await Api.offers.generateOrDownloadOffer(offerId);

        if (response.data && response.data.base64String && response.data.fileExtension) {
            console.log("Otrzymano dane pliku:", response);
            saveBase64File(response.data.base64String, response.data.fileExtension);
        } else {
            console.error("Brak poprawnych danych pliku.");
        }
    } catch (error) {
        console.error("Błąd generowania oferty:", error);
    }
};


const saveBase64File = (base64String: string, fileExtension: string) => {
    try {
        // Konwersja Base64 na Blob
        const byteCharacters = atob(base64String);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });

        // Generowanie dynamicznej nazwy pliku
        const fileName = `Propozycja_cenowa_${props.offer.offerNumber}.pdf`;

        // Tworzenie linku do pobrania pliku
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        
        // Kliknięcie w link i usunięcie go z DOM
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log(`Plik ${fileName} został pobrany.`);
    } catch (error) {
        console.error("Błąd podczas zapisywania pliku:", error);
    }
};


const calculateMargin = (priceNetto: number, producerPriceNetto: number, startingPriceNetto: number) => {
    // Sprawdzamy, czy wartości są poprawne i czy producerPriceNetto nie wynosi 0
    if (!priceNetto || !producerPriceNetto || !startingPriceNetto || producerPriceNetto === 0) {
        return "Brak danych";
    }

    // Obliczenie marży
    const margin1 = ((priceNetto - producerPriceNetto) / producerPriceNetto) * 100;
    const margin2 = ((startingPriceNetto - producerPriceNetto) / producerPriceNetto) * 100;

    // Zaokrąglamy wyniki do dwóch miejsc po przecinku
    return `${margin1.toFixed(2)}% / ${margin2.toFixed(2)}%`;
};

const createOrderFromOffer = (offerId: string) => {
  router.push({ name: 'CreateOrder', params: { offerId } }) 
}
</script>
<template>
    <div class="w-full h-auto !border-b">
        <div class="flex justify-between">
                <div class="font-bold text-lg">
                    Oferta nr. <span class="text-blue-400">{{offer.offerNumber}}</span> dla {{offer.customerName}} <br/>utworzona przez {{offer.createdBy}}
                </div>
                <div>
                    <a @click="closeOfferHandle" class="cursor-pointer">
                    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24"><path fill="currentColor" d="M6.4 19L5 17.6l5.6-5.6L5 6.4L6.4 5l5.6 5.6L17.6 5L19 6.4L13.4 12l5.6 5.6l-1.4 1.4l-5.6-5.6z"/></svg>
                    </a>
                </div>
            </div>
        <div class="flex my-5">
        <el-button type="info">Kontakt(0)</el-button>
        <el-button type="info">Status</el-button>
        <el-button type="info" @click="generateOrDownloadOfferHandle(offer.id)">{{ offer.filePath ? 'Pobierz ofertę' : 'Generuj ofertę' }}</el-button>
        <el-button type="info" @click="createOrderFromOffer(offer.id)">Utwórz zamówienie</el-button>
        <el-button type="info">Kopiuj</el-button>
        </div>
    </div>
    <div class="pt-5">
        <div class="flex grid grid-cols-3 gap-2 text-center font-semibold border-b border-gray-400 pb-2 text-xs">
            <div class="col-span-1">
                Całość (brutto): <span class="!text-[15px]">{{ offer.totalPriceGross }} PLN</span>
            </div>
            <div class="col-span-1">
                Towar (brutto): <span class="!text-[15px]">{{ offer.totalItemPriceGross }} PLN</span>
            </div>
            <div class="col-span-1">
                Wysyłka (brutto): <span class="!text-[15px]">{{ offer.shippingPriceGross }} PLN</span>
            </div>
        </div>
    </div>
    <router-link :to="'/sale/offer/edit/' + offer.id" class=" rounded-md p-1 block text-center text-[14px] font-semibold p-2 w-full my-3 text-white bg-orange-400">Edytuj oferte</router-link>
    <div class="mt-10">
        <ul class="text-sm">
            <li class="flex border-b border-gray-300 pb-4" v-for="item in offer.offerItems" :key="offer.offerId">
                <div class="">
                    <img :src="item.productImage" width="150" height="150" class="object-contain"/>
                </div>
                <div class="block">
                    <a :href="'https://olmag.pl/' + item.slug" target="_blank" rel="noopener noreferrer" class="cursor-pointer text-blue-500">
                        {{ item.productName }}
                    </a>
                    <div class="grid grid-cols-5 gap-5 mt-1 w-full  text-center">
                        <div clas="col-span-1">
                            <span class="block font-semibold">Ilość</span>
                            <span>{{item.quantity}}</span>
                        </div>
                        <div clas="col-span-1">
                            <span class="block font-semibold">Cena</span>
                            <span>{{ item.priceNetto.toFixed(2) }}</span>
                        </div>     
                        <div clas="col-span-1">
                            <span class="block font-semibold">Cena prod.</span>
                            <span>{{ item.producerPriceNetto.toFixed(2) }}</span>
                        </div>                     
                        <div clas="col-span-1">
                            <span class="block font-semibold">Marża</span>
                            <span>{{ calculateMargin(
                                    item.priceNetto ?? 0,
                                    item.producerPriceNetto ?? 0,
                                    item.startingPriceNetto ?? 0
                                ) }}
                            </span>                        </div>                     
                        <div clas="col-span-1">
                            <span class="block font-semibold">Suma</span>
                            <span>{{ item.totalPriceNetto.toFixed(2) }}</span>
                        </div>                   
                    </div>
                    <div class="mt-2">
                        <ul class="inline-block text-xs" v-for="attribute in item.offerItemAttributes">
                            <li>{{attribute.attributeName}}: {{ attribute.attributeValue }} |&nbsp </li>
                        </ul>
                    </div>  
                </div>
            </li>
        </ul>
    </div>
</template>
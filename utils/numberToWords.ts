const persianNumbers = [
  "",
  "یک",
  "دو",
  "سه",
  "چهار",
  "پنج",
  "شش",
  "هفت",
  "هشت",
  "نه",
];

const persianTens = [
  "",
  "ده",
  "بیست",
  "سی",
  "چهل",
  "پنجاه",
  "شصت",
  "هفتاد",
  "هشتاد",
  "نود",
];

const persianTeens = [
  "ده",
  "یازده",
  "دوازده",
  "سیزده",
  "چهارده",
  "پانزده",
  "شانزده",
  "هفده",
  "هجده",
  "نوزده",
];

const persianHundreds = [
  "",
  "یکصد",
  "دویست",
  "سیصد",
  "چهارصد",
  "پانصد",
  "ششصد",
  "هفتصد",
  "هشتصد",
  "نهصد",
];

const persianThousands = ["", "هزار", "میلیون", "میلیارد", "تریلیون"];

function threeDigitToWords(num: number): string {
  const words = [];

  const hundreds = Math.floor(num / 100);
  const tensUnits = num % 100;
  const tens = Math.floor(tensUnits / 10);
  const units = tensUnits % 10;

  if (hundreds) words.push(persianHundreds[hundreds]);

  if (tensUnits >= 10 && tensUnits < 20) {
    words.push(persianTeens[tensUnits - 10]);
  } else {
    if (tens) words.push(persianTens[tens]);
    if (units) words.push(persianNumbers[units]);
  }

  return words.join(" و ");
}

export function numberToWords(input: string | number): string {
  let number = parseInt(input.toString().replace(/[^0-9]/g, ""), 10);

  if (isNaN(number)) return "نامعتبر";

  if (number === 0) return "صفر";

  const result: string[] = [];
  let index = 0;

  while (number > 0) {
    const part = number % 1000;
    if (part !== 0) {
      let partWord = threeDigitToWords(part);
      if (persianThousands[index]) partWord += " " + persianThousands[index];
      result.unshift(partWord);
    }
    number = Math.floor(number / 1000);
    index++;
  }

  return result.join(" و ");
}

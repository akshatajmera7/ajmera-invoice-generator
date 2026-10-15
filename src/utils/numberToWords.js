// Indian currency format converter: converts numbers to Words (Crore, Lakh, Thousand, Hundred, etc.)

const ones = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const tens = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertLessThanOneThousand(num) {
  let str = '';
  if (num >= 100) {
    str += ones[Math.floor(num / 100)] + ' Hundred ';
    num %= 100;
  }
  if (num > 0) {
    if (num < 20) {
      str += ones[num] + ' ';
    } else {
      str += tens[Math.floor(num / 10)] + ' ';
      if (num % 10 > 0) {
        str += ones[num % 10] + ' ';
      }
    }
  }
  return str.trim();
}

export function numberToIndianWords(amount) {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Zero Rupees Only';
  }

  const rounded = Math.round(Number(amount) * 100) / 100;
  if (rounded === 0) {
    return 'Zero Rupees Only';
  }

  const isNegative = rounded < 0;
  const absAmount = Math.abs(rounded);
  const rupees = Math.floor(absAmount);
  const paise = Math.round((absAmount - rupees) * 100);

  let words = '';

  if (rupees === 0) {
    words = '';
  } else {
    let crore = Math.floor(rupees / 10000000);
    let rem = rupees % 10000000;

    let lakh = Math.floor(rem / 100000);
    rem = rem % 100000;

    let thousand = Math.floor(rem / 1000);
    rem = rem % 1000;

    let hundred = rem;

    if (crore > 0) {
      words += convertLessThanOneThousand(crore) + ' Crore ';
    }
    if (lakh > 0) {
      words += convertLessThanOneThousand(lakh) + ' Lakh ';
    }
    if (thousand > 0) {
      words += convertLessThanOneThousand(thousand) + ' Thousand ';
    }
    if (hundred > 0) {
      words += convertLessThanOneThousand(hundred) + ' ';
    }

    words = words.trim() + ' Rupees';
  }

  if (paise > 0) {
    const paiseWords = convertLessThanOneThousand(paise);
    if (words) {
      words += ' and ' + paiseWords + ' Paise';
    } else {
      words = paiseWords + ' Paise';
    }
  }

  if (words) {
    words += ' Only';
  } else {
    words = 'Zero Rupees Only';
  }

  return (isNegative ? 'Minus ' : '') + words;
}

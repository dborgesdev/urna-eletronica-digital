//DEFINIÇÃO DE VARIÁVEIS
let votingData;
let currentStage = 0;
let number = '';
const votingPlace = 'Municipio: 99999 - Minha Cidade &nbsp Zona: 9999 Seção: 9999';

//SELEÇÃO DOS ELEMENTOS DA PÁGINA
const getElId = (element) => document.getElementById(element);
let elements;
const originalUrnaDisplay = getElId('urna-display').cloneNode(true);

function getElements() {
    elements = {
        urnaDisplay: getElId('urna-display'),
        display: {
            headerLeft: getElId('header-left'),
            mainMessage: getElId('display-main-msg'),
            office: getElId('display-office'),
            numberLabel: getElId('number-label'),
            numberBox: getElId('number-box'),
            mainRw2: getElId('rw2'),
            rw2Alert: getElId('rw2-alert'),
            mainRw3: getElId('rw3'),
            partyInitials: getElId('party-initials'),
            mainRw4: getElId('rw4'),
            holderName: getElId('holder-display-name'),
            mainRw5: getElId('rw5'),
            displayAlert: getElId('display-alert'),
            footer: getElId('display-footer'),
            footerAlert: getElId('footer-alert'),
            footerL1: getElId('display-footer-l1'),
            footerL2: getElId('display-footer-l2'),
            footerL3: getElId('display-footer-l3'),
        },
        photosDiv: getElId('display-photos'),
        photos: {
            holderImg: getElId('holder-img'),
            holderLabel: getElId('holder-photo-label'),
            vicePhotosDiv: getElId('display-vices-photo'),
            vice1Img: getElId('vice1-img'),
            vice1Label: getElId('vice1-photo-label'),
            vice2Img: getElId('vice2-img'),
            vice2Label: getElId('vice2-photo-label')
        },
        keyboard: {
            numbers: document.querySelectorAll('.urna__keyboard__number-button'),
            correct: getElId('correct-btn'),
            confirm: getElId('confirm-btn')
        }
    }
}

//FUNÇÕES PRINCIPAIS
async function init() {
    votingData = await getVotingData();
    getElements();
    setListeners();
    startVoting();
    setTimeout(() => votingStages(0), 1500);
}

async function getVotingData() {
    // Lógica para importar os dados da votação por API ou DB
    return geraisPrimeiroTurnoJSON;
}

function startVoting() {
    let currentTime = getDate();
    elements.display.headerLeft.innerHTML = currentTime;
    elements.display.mainMessage.classList.add('main__message--start');
    elements.display.mainMessage.classList.remove('display-none');
    elements.display.mainMessage.innerHTML = '<p>INICIO DA VOTAÇÃO</p><p>IDENTIFIQUE O ELEITOR</p>';
    elements.display.footerL3.classList.add('footer__l3--status');
    elements.display.footerL3.innerHTML = votingPlace;
    elements.display.footerL3.classList.remove('hide');
}

function votingStages(stage) {
    if (stage < votingData.length) {
        resetDisplay();
        setStageDisplay(stage);
    } else {
        endVoting();
    }
}

function setStageDisplay(stage) {
    let fragment = '';
    if(!votingData[stage].vice2) {
        elements.display.mainRw5.classList.add('display-none');
    }
    elements.display.office.innerHTML = votingData[stage].office;
    elements.display.office.classList.remove('hide');
    for(let i=0; i < votingData[stage].digits; i++) {
        if(i === 0) {
            fragment += `<div id="number-input-${i+1}" class="display__number__input blink"> </div>`;
        } else {
            fragment += `<div id="number-input-${i+1}" class="display__number__input"> </div>`;
        }
    }
    elements.display.numberBox.innerHTML = fragment;
}

function registerNumber(key) {
    if(number.length < votingData[currentStage].digits) {
        number += key;
        let currentNumberBox = getElId(`number-input-${number.length}`);
        currentNumberBox.classList.remove('blink');
        currentNumberBox.innerHTML = key;
        if(number.length < votingData[currentStage].digits) {
            let nextNumberBox = getElId(`number-input-${number.length + 1}`);
            nextNumberBox.classList.add('blink');
        } else {
            searchCandidate(number);
        }
        if(number.length === 2) {
            elements.display.headerLeft.innerHTML = 'SEU VOTO PARA'
            elements.display.numberLabel.classList.remove('hide');
            searchParty(number);
        }
    }
}

function searchParty(number) {
    const party = votingData[currentStage].parties.hasOwnProperty(number);
    if(party) {
        elements.display.partyInitials.innerHTML = votingData[currentStage].parties[number].initials;
        elements.display.mainRw3.classList.remove('hide');
    } else {
        elements.display.rw2Alert.classList.remove('display-none');
        elements.display.mainRw2.classList.remove('hide');
        elements.display.displayAlert.classList.remove('hide');
    }
    elements.display.footer.classList.remove('display__footer--no-border');
    elements.display.footer.classList.remove('hide');
}

function searchCandidate(number) {
    const candidate = votingData[currentStage].candidates.hasOwnProperty(number);
    if(candidate) {
        if(votingData[currentStage].candidates[number].sex === 'female') {
            elements.display.office.innerHTML = votingData[currentStage].officeFemale;
            elements.photos.holderImg.alt = votingData[currentStage].officeFemale;
            if(votingData[currentStage].vice1) {
                elements.display.photos.holderLabel.innerHTML = votingData[currentStage].officeFemale;
            }
        } else {
            elements.photos.holderImg.alt = votingData[currentStage].office;
            if(votingData[currentStage].vice1) {
                elements.photos.holderLabel.innerHTML = votingData[currentStage].office;
            }
        }
        elements.display.holderName.innerHTML = votingData[currentStage].candidates[number].name;
        elements.photos.holderImg.src = `${votingData[currentStage].photoSrc}${number}.jpg`;
        if(votingData[currentStage].vice1) {
            // lógica de fotos do VICE 1 - remover hide e display-none
            if(votingData[currentStage].vice2) {
                // lógica de fotos do VICE 2 - remover hide e display-none
                elements.display.footerAlert.classList.add('footer__alert--center');
            }
        }
        elements.display.footerAlert.classList.remove('display-none');
        setTimeout(() => elements.display.footerAlert.classList.add('display-none'), 1500);
        elements.photosDiv.classList.remove('display-none');
        elements.display.mainRw2.classList.remove('hide');
    }
}

function endVoting() {
    resetDisplay();
    let currentTime = getDate();
    elements.display.headerLeft.innerHTML = currentTime;
    elements.display.mainMessage.classList.add('main__message--end');
    elements.display.mainMessage.classList.remove('display-none');
    elements.display.mainMessage.innerHTML = 'FIM';
    elements.display.footerL3.classList.add('footer__l3--status');
    elements.display.footerL3.innerHTML = votingPlace;
    elements.display.footerL3.classList.remove('hide');
}

//FUNÇÕES AUXILIARES
function getDate() {
    let fullDate = new Date();
    let currentDay = fullDate.getDay();
    currentDay = setLocalDay(currentDay);
    let localDate = `${currentDay} ${fullDate.toLocaleDateString()} ${fullDate.toLocaleTimeString()}`;
    return localDate;
}

function setLocalDay(day) {
    let dayInitials;
    switch (day) {
        case 0: 
            dayInitials='DOM';
        break;
        case 1:
            dayInitials='SEG';
        break;
        case 2:
            dayInitials='TER';
        break;
        case 3:
            dayInitials='QUA';
        break;
        case 4:
            dayInitials='QUI';
        break;
        case 5:
            dayInitials='SEX';
        break;
        case 6:
            dayInitials='SÁB';
        break;
    }
    return dayInitials;
}

function resetDisplay() {
    number = '';
    elements.urnaDisplay.replaceWith(originalUrnaDisplay.cloneNode(true));
    getElements();
}

/* LISTENERS DOS BOTÕES DA URNA */
function setListeners() {
    elements.keyboard.numbers.forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-key');
            registerNumber(key);
        });
    });

    elements.keyboard.correct.addEventListener ('click', () => {
        resetDisplay();
        votingStages(currentStage);
    });
}

/* START DA APLICAÇÃO */
init()
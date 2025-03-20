//DEFINIÇÃO DE VARIÁVEIS
let votingData;
let currentTime;
let currentStage = 0;
let number = '';
let hasParty = false;
let confirmCooldown = false;
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
            holderName: getElId('holder-display-name'),
            mainRw3: getElId('rw3'),
            partyInitials: getElId('party-initials'),
            mainRw4: getElId('rw4'),
            vice1Label: getElId('vice1-display-label'),
            vice1Name: getElId('vice1-name'),
            mainRw5: getElId('rw5'),
            vice2Label: getElId('vice2-display-label'),
            vice2Name: getElId('vice2-name'),
            displayAlert: getElId('display-alert'),
            footer: getElId('display-footer'),
            footerAlert: getElId('footer-alert'),
            footerL1: getElId('display-footer-l1'),
            footerL2: getElId('display-footer-l2'),
            footerL3: getElId('display-footer-l3'),
            photosDiv: getElId('display-photos'),
            vicesPhotosDiv: getElId('display-vices-photo'),
            vice2PhotosDiv: getElId('vice2-photo-box'),
        },
        photos: {
            holderImg: getElId('holder-img'),
            holderLabel: getElId('holder-photo-label'),
            vice1Img: getElId('vice1-img'),
            vice1Label: getElId('vice1-photo-label'),
            vice2Img: getElId('vice2-img'),
            vice2Label: getElId('vice2-photo-label')
        },
        keyboard: {
            numbers: document.querySelectorAll('.urna__keyboard__number-button'),
            blank: getElId('blank-btn'),
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
    setTimeout(() => {
        clearInterval(currentTime);
        votingStages(0);
    }, 1500);
}

function getVotingData() {
    // Lógica para importar os dados da votação por API ou DB
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                resolve(geraisPrimeiroTurnoJSON);
            }, 1000);
        } catch (error) {
            reject("Erro ao carregar os dados da votação!");
        }
    });
}

function startVoting() {
    currentTime = setInterval(getDate, 1000);
    getDate();
    elements.display.mainMessage.classList.add('main__message--start');
    elements.display.mainMessage.classList.remove('display-none');
    elements.display.mainMessage.innerHTML = '<p>INICIO DA VOTAÇÃO</p><p>IDENTIFIQUE O ELEITOR</p>';
    elements.display.footerL3.classList.add('footer__l3--status');
    elements.display.footerL3.innerHTML = votingPlace;
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
        if(number.length === 2) {
            hasParty = searchParty(number);
        }
        if(number.length < votingData[currentStage].digits) {
            let nextNumberBox = getElId(`number-input-${number.length + 1}`);
            nextNumberBox.classList.add('blink');
        } else {
            searchCandidate(number, hasParty);
        }
    }
}

function searchParty(number) {
    const party = votingData[currentStage].parties.hasOwnProperty(number);
    if(votingData[currentStage].nominal) {
        if(party) {
            elements.display.partyInitials.innerHTML = votingData[currentStage].parties[number].initials;
        } else {
            elements.display.rw2Alert.innerHTML = 'NÚMERO ERRADO';
            elements.display.displayAlert.innerHTML = 'VOTO NULO';
        }
    } else {
        if(party) {
            elements.display.partyInitials.innerHTML = votingData[currentStage].parties[number].initials;
            elements.display.mainRw3.classList.remove('hide');
        } else {
            elements.display.rw2Alert.innerHTML = 'NÚMERO ERRADO';
            elements.display.rw2Alert.classList.remove('display-none');
            elements.display.mainRw2.classList.remove('hide');
            elements.display.displayAlert.innerHTML = 'VOTO NULO';
            elements.display.displayAlert.classList.remove('hide');
        }
        elements.display.headerLeft.innerHTML = 'SEU VOTO PARA'
        elements.display.numberLabel.classList.remove('hide');
        elements.display.footer.classList.remove('display__footer--no-border');
        elements.display.footer.classList.remove('hide');
    }
    return party;
}

function searchCandidate(number, hasParty) {
    const candidate = votingData[currentStage].candidates.hasOwnProperty(number);
    if(hasParty) {
        if(candidate) {
            if(votingData[currentStage].candidates[number].sex === 'female') {
                elements.display.office.innerHTML = votingData[currentStage].officeFemale;
                elements.photos.holderImg.alt = votingData[currentStage].officeFemale;
                if(votingData[currentStage].vice1) {
                    elements.photos.holderLabel.innerHTML = votingData[currentStage].officeFemale;
                }
            } else {
                elements.photos.holderImg.alt = votingData[currentStage].office;
                if(votingData[currentStage].vice1) {
                    elements.photos.holderLabel.innerHTML = votingData[currentStage].office;
                }
            }
            elements.display.holderName.innerHTML = votingData[currentStage].candidates[number].name;
            if(votingData[currentStage].nominal) {
                elements.display.mainRw3.classList.remove('hide');
                elements.display.headerLeft.innerHTML = 'SEU VOTO PARA'
                elements.display.footer.classList.remove('display__footer--no-border');
                elements.display.footer.classList.remove('hide');
            }
            elements.photos.holderImg.src = `${votingData[currentStage].photoSrc}${number}.jpg`;
            if(votingData[currentStage].vice1) {
                elements.display.vice1Label.innerHTML = `${votingData[currentStage].candidates[number].vice1.role}: `;
                elements.display.vice1Name.innerHTML = votingData[currentStage].candidates[number].vice1.name;
                elements.photos.vice1Label.innerHTML = votingData[currentStage].candidates[number].vice1.role;
                elements.photos.vice1Img.src = `${votingData[currentStage].photoSrc}${number}-1.jpg`;
                elements.display.mainRw4.classList.remove('hide');
                elements.display.vicesPhotosDiv.classList.remove('display-none');
                if(votingData[currentStage].vice2) {
                    elements.display.vice2Label.innerHTML = `${votingData[currentStage].candidates[number].vice2.role}: `;
                    elements.display.vice2Name.innerHTML = votingData[currentStage].candidates[number].vice2.name;
                    elements.photos.vice2Label.innerHTML = votingData[currentStage].candidates[number].vice2.role;
                    elements.photos.vice2Img.src = `${votingData[currentStage].photoSrc}${number}-2.jpg`;
                    elements.display.mainRw5.classList.remove('hide');
                    elements.display.vice2PhotosDiv.classList.remove('display-none');
                    elements.display.footerAlert.classList.remove('footer__alert--center');
                }
            } 
            elements.display.photosDiv.classList.remove('display-none');    
        } else if(votingData[currentStage].nominal) {
            elements.display.rw2Alert.innerHTML = 'NÚMERO ERRADO';
            elements.display.rw2Alert.classList.remove('display-none');
            elements.display.mainRw2.classList.remove('hide');
            elements.display.displayAlert.innerHTML = 'VOTO NULO';
            elements.display.displayAlert.classList.remove('hide');
        } else {
            elements.display.rw2Alert.innerHTML = 'CANDIDATO INEXISTE';
            elements.display.rw2Alert.classList.remove('display-none');
            elements.display.displayAlert.innerHTML = 'VOTO DE LEGENDA';
            elements.display.displayAlert.classList.remove('hide');
        }
    } else if(votingData[currentStage].nominal) {
        elements.display.rw2Alert.classList.remove('display-none');
        elements.display.mainRw2.classList.remove('hide');
        elements.display.displayAlert.classList.remove('hide');
        elements.display.headerLeft.innerHTML = 'SEU VOTO PARA';
        elements.display.footer.classList.remove('display__footer--no-border');
        elements.display.footer.classList.remove('hide');
    }
    displayAlert('confirmVote');
    elements.display.mainRw2.classList.remove('hide');
}

function endVoting() {
    resetDisplay();
    currentTime = setInterval(getDate, 1000);
    getDate();
    elements.display.mainMessage.classList.add('main__message--end');
    elements.display.mainMessage.classList.remove('display-none');
    elements.display.mainMessage.innerHTML = 'FIM';
    elements.display.footerL3.classList.add('footer__l3--status');
    elements.display.footerL3.innerHTML = votingPlace;
}

//FUNÇÕES AUXILIARES
function getDate() {
    let fullDate = new Date();
    let currentDay = fullDate.getDay();
    currentDay = setLocalDay(currentDay);
    let localDate = `${currentDay} ${fullDate.toLocaleDateString()} ${fullDate.toLocaleTimeString()}`;
    elements.display.headerLeft.innerHTML = localDate;
    //return localDate;
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

function displayAlert(alert) {
    switch (alert) {
        case 'confirmVote':
            elements.display.footerAlert.classList.remove('display-none');
            confirmCooldown = true;
            setTimeout(() => {
                elements.display.footerAlert.classList.add('display-none');
                confirmCooldown = false;
            }, 1000);
        break;
    }
}

function blankVoteDisplay() {
    elements.display.numberBox.classList.add('display-none');
    elements.display.headerLeft.innerHTML = 'SEU VOTO PARA';
    elements.display.mainMessage.innerHTML = 'VOTO EM BRANCO';
    elements.display.mainMessage.classList.add('main__message--branco');
    elements.display.mainMessage.classList.add('blink');
    elements.display.mainMessage.classList.remove('display-none');
    displayAlert('confirmVote');
    elements.display.footer.classList.remove('display__footer--no-border');
    elements.display.footer.classList.remove('hide');
}

/* LISTENERS DOS BOTÕES DA URNA */
function setListeners() {
    elements.keyboard.numbers.forEach(button => {
        button.addEventListener('click', () => {
            if(number.length < votingData[currentStage].digits) {
                const key = button.getAttribute('data-key');
                registerNumber(key);
            }
        });
    });

    elements.keyboard.blank.addEventListener ('click', () => {
        if(number.length === 0) {
            number = 'BRANCO';
            blankVoteDisplay();
        }
    });

    elements.keyboard.correct.addEventListener ('click', () => {
        if(number.length !== 0) {
            resetDisplay();
            votingStages(currentStage);
        }
    });

    elements.keyboard.confirm.addEventListener ('click', () => {
        if(!confirmCooldown) {
            if(number.length >= 2) {
                if(number.length < votingData[currentStage].digits && !votingData[currentStage].nominal) {
                    if(hasParty) {
                        elements.display.displayAlert.innerHTML = 'VOTO DE LEGENDA';
                        elements.display.displayAlert.classList.remove('hide');
                    }
                    displayAlert('confirmVote');
                    for(let i = number.length + 1; i <= votingData[currentStage].digits; i++) {
                        number += ' '
                        getElId(`number-input-${i}`).classList.remove('blink');
                        getElId(`number-input-${i}`).classList.add('number__input--disabled');
                    }
                } else if(number.length >= votingData[currentStage].digits) {
                resetDisplay();
                currentStage++;
                votingStages(currentStage);
                console.log('confirmado');
                }
            }
        }
    });
}

/* START DA APLICAÇÃO */
init()
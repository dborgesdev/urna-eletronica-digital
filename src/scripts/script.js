/* DEFINIÇÃO DE VARIÁVEIS DE INPUT*/
const database = [
    { type: 'Gerais', shift: '1°', local:'Brasil', dataSrc: geraisPrimeiroTurnoJSON },
    // { type: 'Gerais', shift: '2°', local:'Brasil', dataSrc: geraisSegundoTurnoJSON },
    // { type: 'Municipais', shift: '1°', local:'Cidade-UF', dataSrc: municipaisPrimeiroTurnoJSON },
    // { type: 'Municipais', shift: '2°', local:'Cidade-UF', dataSrc: municipaisSegundoTurnoJSON }
]
const votingPlace = 'Municipio: 99999 - Minha Cidade &nbsp Zona: 9999 Seção: 9999';

/* DEFINIÇÃO DE VARIÁVEIS DE TRABALHO */
let votingData;
let currentTime;
let currentStage = 0;
let number = '';
let hasParty = false;
let confirmCooldown = false;

/* DEFINIÇÃO DE VARIÁVEIS DOS ELEMENTOS DA PÁGINA */
const getElId = (element) => document.getElementById(element);
const originalUrnaDisplay = getElId('urna-display').cloneNode(true);
let elements;
let displayManager;

/* DEFINIÇÃO DE VARIÁVEIS DE SOM DA URNA */
const sound = {
    stage: new Audio('src/assets/sound/inter.mp3'),
    end: new Audio('src/assets/sound/fim.mp3'),
    error: new Audio('src/assets/sound/ops.mp3')
};

/* FUNÇÕES PRINCIPAIS */
function welcome() { 
    getElements();
    setDisplayManager();
    displayManager.modalAlert('start');
    setModalListeners();
}

async function init(dataSrc) { 
    displayManager.screen('start');
    votingData = await getVotingData(dataSrc);
    clearInterval(currentTime);
    votingStages(0);
    setUrnaListeners();
}

function getVotingData(dataSrc) {
    // Lógica para importar os dados da votação por API ou DB
    return new Promise((resolve, reject) => {
        try {
            setTimeout(() => {
                resolve(dataSrc);
            }, 1500);
        } catch (error) {
            reject("Erro ao carregar os dados da votação!");
        }
    });
}

function votingStages(stage) {
    if (stage < votingData.length) {
        resetDisplay();
        displayManager.stage(stage);
        setPartiesList();
    } else {
        elements.list.div.classList.add('display-none');
        displayManager.screen('saving');
        setTimeout(() => {
            displayManager.screen('end');

        }, 1000);
    }
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
        }
    } else {
        if(party) {
            elements.display.partyInitials.innerHTML = votingData[currentStage].parties[number].initials;
            elements.display.mainRw3.classList.remove('hide');
        } else {
            displayManager.screenAlert('wrongNumber');
        }
        elements.display.numberLabel.classList.remove('hide');
        displayManager.headFooter('stage');
    }
    return party;
}

function searchCandidate(number, hasParty) {
    const candidate = votingData[currentStage].candidates.hasOwnProperty(number);
    if(hasParty) {
        if(candidate) {
            checkCandidateSex();
            if(votingData[currentStage].nominal) {
                elements.display.mainRw3.classList.remove('hide');
                displayManager.headFooter('stage');
            }

            elements.display.holderName.innerHTML = votingData[currentStage].candidates[number].name;
            elements.photos.holderImg.src = `${votingData[currentStage].photoSrc}${number}.jpg`;
            elements.photos.div.classList.remove('display-none');
            searchVices();

        } else if(votingData[currentStage].nominal) {
            displayManager.screenAlert('wrongNumber');
            displayManager.headFooter('stage');

        } else {
            displayManager.screenAlert('nullCandidate');
        }

    } else if(votingData[currentStage].nominal) {
        displayManager.screenAlert('wrongNumber');
        displayManager.headFooter('stage');
    }

    displayManager.confirmVote();
    elements.display.mainRw2.classList.remove('hide');
}

function checkCandidateSex() {
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
}

function searchVices() {
    if(votingData[currentStage].vice1) {
        elements.display.vice1Label.innerHTML = `${votingData[currentStage].candidates[number].vice1.role}: `;
        elements.display.vice1Name.innerHTML = votingData[currentStage].candidates[number].vice1.name;
        elements.photos.vice1Label.innerHTML = votingData[currentStage].candidates[number].vice1.role;
        elements.photos.vice1Img.src = `${votingData[currentStage].photoSrc}${number}-1.jpg`;
        elements.display.mainRw4.classList.remove('hide');
        elements.photos.vicesDiv.classList.remove('display-none');
    }
    if(votingData[currentStage].vice2) {
        elements.display.vice2Label.innerHTML = `${votingData[currentStage].candidates[number].vice2.role}: `;
        elements.display.vice2Name.innerHTML = votingData[currentStage].candidates[number].vice2.name;
        elements.photos.vice2Label.innerHTML = votingData[currentStage].candidates[number].vice2.role;
        elements.photos.vice2Img.src = `${votingData[currentStage].photoSrc}${number}-2.jpg`;
        elements.display.mainRw5.classList.remove('hide');
        elements.photos.vice2Div.classList.remove('display-none');
        elements.display.footerAlert.classList.remove('footer__alert--center');
    }
}

/* FUNÇÕES AUXILIARES */
function getDate() {
    let fullDate = new Date();
    let currentDay = fullDate.getDay();
    currentDay = setLocalDay(currentDay);
    let localDate = `${currentDay} ${fullDate.toLocaleDateString()} ${fullDate.toLocaleTimeString()}`;
    elements.display.headerLeft.innerHTML = localDate;
}

function setLocalDay(day) {
    let dayInitials;
    switch(day) {
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

/* FUNÇÕES DE CONTROLE DE TELA */
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
            footerL3: getElId('display-footer-l3')  
        },
        photos: {
            div: getElId('display-photos'),
            holderImg: getElId('holder-img'),
            holderLabel: getElId('holder-photo-label'),
            vicesDiv: getElId('display-vices-photo'),
            vice1Img: getElId('vice1-img'),
            vice1Label: getElId('vice1-photo-label'),
            vice2Div: getElId('vice2-photo-box'),
            vice2Img: getElId('vice2-img'),
            vice2Label: getElId('vice2-photo-label')
        },
        keyboard: {
            numbers: document.querySelectorAll('.urna__keyboard__number-button'),
            blank: getElId('blank-btn'),
            correct: getElId('correct-btn'),
            confirm: getElId('confirm-btn')
        },
        modal: { 
            div: getElId('modal'),
            message: getElId('popup-message'),
            election: getElId('select-election'),
            closer: getElId('modal-closer')
        },
        list: {
            div: getElId('candidates-list-div'),
            head: getElId('candidates-list-head'),
            body: getElId('candidates-list-body'),
            closer: getElId('candidates-list-closer')
        }
    }
}

function resetDisplay() {
    number = '';
    elements.urnaDisplay.replaceWith(originalUrnaDisplay.cloneNode(true));
    getElements();
}

function setDisplayManager() {
    displayManager = {
        headFooter: (type) => {
            switch(type) {
                case 'stage':
                    elements.display.headerLeft.innerHTML = 'SEU VOTO PARA'
                    elements.display.footer.classList.remove('display__footer--no-border');
                    elements.display.footer.classList.remove('hide');
                break;
                case 'time':
                    currentTime = setInterval(getDate, 1000);
                    getDate();
                    elements.display.footerL3.classList.add('footer__l3--status');
                    elements.display.footerL3.innerHTML = votingPlace;
                break;
            }
        },
        screen: (type) => {
            let dspMsg;
            if(type === 'blank') {
                dspMsg = 'VOTO EM BRANCO';
                elements.display.numberBox.classList.add('display-none');
                elements.display.mainMessage.classList.add('blink');
                displayManager.confirmVote();
                displayManager.headFooter('stage');
            } else if(type === 'start' || type === 'end' || type === 'saving'){ 
                switch(type) {
                    case 'start':
                        dspMsg = '<p>INICIO DA VOTAÇÃO</p><p>CARREGANDO DADOS...</p>';
                    break;
                    case 'end':
                        dspMsg = 'FIM';
                        resetDisplay();
                        sound.end.play();
                    break;
                    case 'saving':
                        dspMsg = `
                        <div class="main__message__saving-bar"></div>
                        <span class="message__saving-bar__label">GRAVANDO</span>
                        `;
                        resetDisplay();
                    break;
                }
                displayManager.headFooter('time');
            }

            elements.display.mainMessage.innerHTML = dspMsg;
            elements.display.mainMessage.classList.add(`main__message--${type}`);
            elements.display.mainMessage.classList.remove('display-none');
        },
        stage: (stage) => {
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
        },
        confirmVote: () => {
            elements.display.footerAlert.classList.remove('display-none');
            confirmCooldown = true;
            setTimeout(() => {
                elements.display.footerAlert.classList.add('display-none');
                confirmCooldown = false;
            }, 1000);
        },
        screenAlert: (type) => {
            let numMsg;
            if(type === 'legendVote' || type === 'nullCandidate') {
                elements.display.displayAlert.innerHTML = 'VOTO DE LEGENDA';
                elements.display.displayAlert.classList.remove('hide');
                if(type === 'nullCandidate') {
                    numMsg = 'CANDIDATO INEXISTENTE';
                }
            } 
            if(type === 'wrongNumber' || type === 'nullCandidate') {
                if(type === 'wrongNumber') {
                    numMsg = 'NÚMERO ERRADO';
                    elements.display.displayAlert.innerHTML = 'VOTO NULO';
                    elements.display.displayAlert.classList.remove('hide');
                }
                elements.display.rw2Alert.innerHTML = numMsg;
                elements.display.rw2Alert.classList.remove('display-none');
                elements.display.mainRw2.classList.remove('hide');
            }
        },
        modalAlert: (type) => {
            let modalMsg;
            if(type === 'start') {
                let fragment = '';
                modalMsg = '<strong>Para Iniciar:</strong> Selecione a Eleição que Deseja Simular';
                database.forEach((value, index) => {
                    fragment += `
                    <div id="election-${index}" class="modal__election__card" data-key="${index}">
                        <div class="card__election__type">ELEIÇÕES ${value.type.toUpperCase()}</div>
                        <div class="card__election__shift">${value.shift} Turno</div>
                    </div>
                    `;
                });
                elements.modal.message.classList.add('pop-up__message--title');
                elements.modal.election.classList.remove('display-none');
                elements.modal.closer.classList.add('display-none');
                elements.modal.election.innerHTML = fragment;
            } else {
                switch (type) {
                    case 'numbers':
                        modalMsg = 'O número do candidato já está completo. Não é possível utilizar teclas numéricas neste momento';
                    break;
                    case 'blank':
                        modalMsg = 'Para votar em <strong>BRANCO</strong> o campo de voto deve estar vazio.<br/>Aperte CORRIGE para apagar o campo de voto';
                    break;
                    case 'correct':
                        modalMsg = 'Para utilizar o <strong>CORRIGE</strong> você deve ter digitado algum número ou ter votado em BRANCO';
                    break;
                    case 'confirm':
                        if(votingData[currentStage].nominal) {
                            modalMsg = 'Para <strong>CONFIRMAR</strong> é necessário digitar o número do candidato ou votar em BRANCO';
                        } else {
                            modalMsg = 'Para <strong>CONFIRMAR</strong> é necessário digitar pelo menos o número do partido ou votar em BRANCO';
                        }
                    break;
                }

                sound.error.play();
            }
            elements.modal.message.innerHTML = modalMsg;
            elements.modal.div.classList.remove('display-none');
        }
    }
}

function setPartiesList() {
    let fragment = '';
    elements.list.head.innerHTML = 'Para visualização dos candidatos, <strong>selecione um partido</strong>:';
    Object.entries(votingData[currentStage].parties).forEach(([key, value]) => {
        fragment += `
            <div id="list-card-party-${key}" class="candidates-list__card list__card--link" data-key="${key}">
                <div class="card__party__title">${key} ${value.initials}</div>
                <div class="card__party__description">${value.name}</div>
            </div>
        `;
    });
    elements.list.body.innerHTML = fragment;
    elements.list.closer.classList.add('display-none');
    elements.list.div.classList.remove('display-none');
    setListListeners();
}

function searchCandidates(prefix) {
    const candidatesObj = votingData[currentStage].candidates;
    const matchCandidatesObj = Object.keys(candidatesObj)
        .filter(key => key.startsWith(prefix))
        .reduce((acc, key) => {
            acc[key] = { ...candidatesObj[key] };
            return acc;
        }, {});
    return matchCandidatesObj;
}

function showCandidates(party, list) {
    let fragment = '';
    elements.list.head.innerHTML = `${party} ${votingData[currentStage].parties[party].initials} - ${votingData[currentStage].parties[party].name} - <strong>${votingData[currentStage].office}</strong>`;
    Object.entries(list).forEach(([key, value]) => {
        fragment += `
            <div id="list-card-candidate-${key}" class="candidates-list__card">
                <img id="card-candidate-photo-${key}" class="card__candidate__photo" src="${votingData[currentStage].photoSrc}/${key}.jpg" alt="${value.name}" />
                <span id="card-candidate-name-${key}" class="card__candidate__name">${value.name}</span>
                <span id="card-candidate-number-${key}" class="card__candidate__number">${key}</span>
            </div>
        `;
    });
    elements.list.body.innerHTML = fragment;
    elements.list.closer.classList.remove('display-none');
}

function closeWelcomeModal() {
    elements.modal.div.classList.add('display-none')
    elements.modal.message.classList.remove('pop-up__message--title');
    elements.modal.election.classList.add('display-none');
    elements.modal.closer.classList.remove('display-none');
    elements.modal.election.innerHTML = '';
}

/* LISTENERS DO MODAL */
function setModalListeners() {
    document.querySelectorAll('.modal__election__card').forEach(button => {
        button.addEventListener('click', () => {
            const key = button.getAttribute('data-key');
            const dataSrc = database[key].dataSrc;
            init(dataSrc);
            closeWelcomeModal();
        });
    });

    elements.modal.closer.addEventListener('click', () => elements.modal.div.classList.add('display-none'));
}

/* LISTENERS DOS BOTÕES DA URNA */
function setUrnaListeners() {
    elements.keyboard.numbers.forEach(button => {
        button.addEventListener('click', () => {
            if(number.length < votingData[currentStage].digits) {
                const key = button.getAttribute('data-key');
                registerNumber(key);
            } else {
                displayManager.modalAlert('numbers');
            }
        });
    });

elements.keyboard.blank.addEventListener('click', () => {
        if(number.length === 0) {
            number = 'BRANCO';
            displayManager.screen('blank');
        } else {
            displayManager.modalAlert('blank');
        }
    });

    elements.keyboard.correct.addEventListener('click', () => {
        if(!confirmCooldown){
            if(number.length !== 0) {
                resetDisplay();
                votingStages(currentStage);
            } else {
                displayManager.modalAlert('correct');
            }
        } else {
            sound.error.play();
        }
    });

    elements.keyboard.confirm.addEventListener('click', () => {
        if(!confirmCooldown) {
            if(number.length >= 2 && number.length < votingData[currentStage].digits) {
                if(!votingData[currentStage].nominal) {
                    if(hasParty) {
                        displayManager.screenAlert('legendVote')
                    }
                    displayManager.confirmVote();
                    for(let i = number.length + 1; i <= votingData[currentStage].digits; i++) {
                        number += ' '
                        getElId(`number-input-${i}`).classList.remove('blink');
                        getElId(`number-input-${i}`).classList.add('number__input--disabled');
                    }
                } else {
                    displayManager.modalAlert('confirm');
                }
            } else if(number.length >= 2) {
                resetDisplay();
                currentStage++;
                sound.stage.play();
                votingStages(currentStage);
            } else {
                displayManager.modalAlert('confirm');
            }
        } else {
            sound.error.play();
        }
    });
}

/* LISTENERS DA LISTA DE CANDIDATOS */
function setListListeners() {
    document.querySelectorAll('.list__card--link').forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.getAttribute('data-key');
            const matchCandidates = searchCandidates(key);
            showCandidates(key, matchCandidates);
        });
    });

    elements.list.closer.addEventListener('click', () => {
        elements.list.closer.classList.add('display-none');
        setPartiesList();
    });
}

/* START DA APLICAÇÃO */
welcome();
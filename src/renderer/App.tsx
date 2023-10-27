/* eslint-disable no-nested-ternary */
import { useState, useEffect, useRef } from 'react';
import {
  ChakraProvider,
  Image,
  Button,
  Input,
  useToast,
  ModalOverlay,
  useDisclosure,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  Spinner,
} from '@chakra-ui/react';
import { MemoryRouter as Router, Routes, Route } from 'react-router-dom';
import 'tailwindcss/tailwind.css';
import './App.css';

import irinas from '../../assets/sor.png';
import mimilys from '../../assets/camily.png';
import launs from '../../assets/luan.png';

import karl from '../../assets/karl.jpg';
import comunas from '../../assets/irineucomuna.png';
import marx from '../../assets/stalin.png';

import theme from './theme';

const MainHome = () => {
  const [frequencia, setFrequencia] = useState(60);
  const [input, setInput] = useState<string>('');
  const [motor, setMotor] = useState(false);
  const [revolucao, iniciarRevolucao] = useState(false);
  const [menuRevolucao, setMenuRevolucao] = useState(false);
  const ref = useRef<HTMLAudioElement>();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true });

  useEffect(() => {
    window.electron.ipcRenderer.on('message', (message) => {
      if (message.type === 'ACK') onClose();

      if (message.type === 'FOICE_E_MARTELO') {
        setMenuRevolucao(true);

        setTimeout(() => {
          iniciarRevolucao(true);
        }, 300);

        setTimeout(() => {
          setMenuRevolucao(false);
          ref.current = new Audio(message.state);
          ref.current.volume = 0.2;
          ref.current.play();
        }, 2000);
      }

      if (message.type === 'PARE') {
        if (ref.current) ref?.current?.pause();

        setMenuRevolucao(true);

        setTimeout(() => {
          iniciarRevolucao(false);
        }, 300);

        setTimeout(() => {
          setMenuRevolucao(false);
        }, 1300);
      }

      if (message.type === 'ARM') {
        if (message.state) {
          onClose();
          setFrequencia(60);
          setMotor(false);
          return;
        }

        onOpen();
      }
    });
  }, [onClose, onOpen]);

  const ligaDesligaMotor = () => {
    setMotor(!motor);

    window.electron.ipcRenderer.sendMessage('message', {
      type: 'MOTOR',
      state: !motor,
    });
  };

  const mudaFreq = (freq: number): void => {
    if (Number.isNaN(freq)) return;

    if (freq < 40) {
      toast({
        title: 'A frequência não pode ser menor que 40Hz',
        status: 'warning',
      });
      return;
    }

    if (freq > 120) {
      toast({
        title: 'A frequência não pode ser maior que 120Hz',
        status: 'error',
      });
      return;
    }

    toast({
      title: 'Frequência alterada com sucesso!',
      status: 'success',
      duration: 2000,
    });

    window.electron.ipcRenderer.sendMessage('message', {
      type: 'FREQ',
      state: freq,
    });

    setFrequencia(freq);
    setInput('');
  };

  return (
    <div className="my-10 bg-[#191919]">
      <Modal
        isCentered
        isOpen={menuRevolucao}
        onClose={() => {}}
        closeOnEsc={false}
        closeOnOverlayClick={false}
      >
        <ModalOverlay
          bg="red.500"
          backdropFilter="blur(40px) hue-rotate(60deg)"
        />
      </Modal>
      <section
        id="descritpion"
        className="flex-1 flex p-6 container min-h-fit mx-auto max-w-7xl"
      >
        <div className="md:max-w-xl">
          <h1 className="text-white mt-6 font-bold md:text-5xl">
            <span className={revolucao ? 'text-red-600' : 'text-primary'}>
              {revolucao
                ? 'Convensão dos Proletários'
                : 'Conversor de Frequência'}
            </span>
          </h1>
          <p className="mt-4 font-describe text-describe text-base md:text-xl">
            {revolucao
              ? 'Proletários de todos os países, uni-vos.'
              : 'Desenvolvido por Camily e Luan, turma 4423!'}
          </p>

          <section className="container min-h-fit p-6 mx-auto max-w-7xl">
            <div className="flex items-center gap-2 container min-h-fit mx-auto max-w-7xl mb-3">
              <div className="bg-secondary-bg h-1 flex-1 px-2" />
            </div>
            <h2
              className={`${
                revolucao ? 'text-yellow-500' : 'text-white'
              } font-bold text-center  md:text-4xl`}
            >
              {revolucao ? 'A Burguesia nos Controla' : 'Controle'}
            </h2>
            <p className="mt-4 font-describe text-describe text-base md:text-xl">
              {revolucao ? 'Manifestos Lidos: ' : 'Frequência do Seno: '}
              <span className="text-primary">
                {frequencia}
                {revolucao ? '' : 'Hz'}
              </span>
            </p>{' '}
            <p className="mt-4 font-describe text-describe text-base md:text-xl">
              {revolucao ? 'Situação da Revolução: ' : 'Estado da Saída: '}
              {motor ? (
                <>
                  <Spinner
                    color="green.500"
                    emptyColor="green.700"
                    speed="1.2s"
                  />{' '}
                  {revolucao ? 'Em andamento' : 'Ligada'}
                </>
              ) : (
                <>
                  <Spinner color="red.600" emptyColor="red.600" />{' '}
                  {revolucao ? 'Parada! Bora camaradas' : 'Desligada'}
                </>
              )}
            </p>{' '}
            <div className="my-6 flex">
              <Input
                placeholder={
                  revolucao
                    ? 'Repassar o dinheiro da burguesia'
                    : 'Alterar Frequência'
                }
                className="min-w-max text-white"
                value={input}
                onChange={(e) => {
                  e.preventDefault();
                  setInput(e.target.value);
                }}
                type="number"
              />
              <Button
                className="ml-2 hover:bg-slate-500"
                onClick={() => mudaFreq(Number(input))}
              >
                {revolucao ? 'Repassar' : 'Enviar'}
              </Button>
            </div>
            <div className="my-6 min-w-max">
              <Button
                onClick={() => ligaDesligaMotor()}
                className={`min-w-full h-12 hover:bg-slate-500 ${
                  motor ? 'bg-red-500' : 'bg-green-500'
                }`}
              >
                {motor
                  ? revolucao
                    ? 'Parar Revolução'
                    : 'Desligar Saída'
                  : revolucao
                  ? 'Começar Revolução'
                  : 'Ligar Saída'}
              </Button>
            </div>
            <Modal
              isCentered
              isOpen={isOpen}
              onClose={onClose}
              closeOnEsc={false}
              closeOnOverlayClick={false}
            >
              <ModalOverlay backdropFilter="blur(10px)" />
              <ModalContent>
                <ModalHeader>ARM Desconectado</ModalHeader>
                <ModalBody>
                  <Text>
                    O ARM não está conectado ao computador! Conecte-o e aguarde.
                  </Text>
                </ModalBody>
              </ModalContent>
            </Modal>
          </section>
        </div>
        <div className="hidden flex-1 lg:flex justify-center items-center gap-4">
          <Image
            src={revolucao ? karl : mimilys}
            width={150}
            height={400}
            className="rounded-2xl"
            alt="Menhera comendo pipica"
          />
          <Image
            src={revolucao ? comunas : irinas}
            width={150}
            height={500}
            className="rounded-2xl"
            alt="Menhera comendo pipica"
          />
          <Image
            src={revolucao ? marx : launs}
            width={150}
            height={400}
            className="rounded-2xl"
            alt="Menhera comendo pipica"
          />
        </div>
      </section>
    </div>
  );
};

export default function App() {
  return (
    <ChakraProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<MainHome />} />
        </Routes>
      </Router>
    </ChakraProvider>
  );
}
